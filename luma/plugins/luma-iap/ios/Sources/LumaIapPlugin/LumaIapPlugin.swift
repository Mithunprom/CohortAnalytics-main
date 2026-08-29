import Foundation
import Capacitor
import StoreKit

@objc(LumaIapPlugin)
public class LumaIapPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LumaIapPlugin"
    public let jsName = "LumaIap"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise)
    ]

    private let productIds: Set<String> = [
        "app.luma.spark.plus.monthly",
        "app.luma.spark.plus.yearly"
    ]

    private var updatesTask: Task<Void, Never>?

    override public func load() {
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                guard case .verified(let transaction) = update else { continue }
                await transaction.finish()
                self?.notifyListeners("transactionUpdate", data: [
                    "productId": transaction.productID,
                    "transactionId": String(transaction.id)
                ])
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: productIds)
                call.resolve([
                    "products": products.map { product in
                        [
                            "id": product.id,
                            "displayName": product.displayName,
                            "displayPrice": product.displayPrice,
                            "description": product.description
                        ]
                    }
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? ""
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.resolve(["ok": false, "reason": "missing-product"])
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    let transaction = try Self.checkVerified(verification)
                    await transaction.finish()
                    call.resolve(Self.payload(for: transaction, ok: true))
                case .userCancelled:
                    call.resolve(["ok": false, "reason": "cancelled"])
                case .pending:
                    call.resolve(["ok": false, "reason": "pending"])
                @unknown default:
                    call.resolve(["ok": false, "reason": "unknown"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                if let payload = await currentEntitlement() {
                    call.resolve(payload)
                } else {
                    call.resolve(["ok": false, "reason": "none"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func status(_ call: CAPPluginCall) {
        Task {
            if let payload = await currentEntitlement() {
                call.resolve(payload)
            } else {
                call.resolve(["ok": false, "reason": "none"])
            }
        }
    }

    private func currentEntitlement() async -> [String: Any]? {
        for await entitlement in Transaction.currentEntitlements {
            guard case .verified(let transaction) = entitlement else { continue }
            guard productIds.contains(transaction.productID) else { continue }
            if let expiration = transaction.expirationDate, expiration < Date() {
                continue
            }
            return Self.payload(for: transaction, ok: true)
        }
        return nil
    }

    private static func payload(for transaction: Transaction, ok: Bool) -> [String: Any] {
        var body: [String: Any] = [
            "ok": ok,
            "productId": transaction.productID,
            "transactionId": String(transaction.id)
        ]
        if let expiration = transaction.expirationDate {
            body["expiresAt"] = ISO8601DateFormatter().string(from: expiration)
        }
        return body
    }

    private static func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let value):
            return value
        }
    }
}
