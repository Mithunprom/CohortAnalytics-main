import { Capacitor } from '@capacitor/core'
import { LumaIap } from 'luma-iap'
import { PRODUCTS, planFromProductId } from './rules.js'

export function purchaseMode() {
  try {
    return Capacitor.isNativePlatform() ? 'storekit' : 'demo'
  } catch {
    return 'demo'
  }
}

export function appleProductId(plan) {
  return PRODUCTS[plan]?.appleProductId || null
}

export async function purchasePlan(plan) {
  const product = PRODUCTS[plan]
  if (!product) return { ok: false, reason: 'unknown' }
  if (purchaseMode() !== 'storekit') {
    return {
      ok: true,
      mode: 'demo',
      plan,
      productId: product.appleProductId
    }
  }
  try {
    const result = await LumaIap.purchase({ productId: product.appleProductId })
    if (!result?.ok) {
      return { ok: false, mode: 'storekit', reason: result?.reason || 'failed' }
    }
    return {
      ok: true,
      mode: 'storekit',
      plan: planFromProductId(result.productId) || plan,
      productId: result.productId,
      transactionId: result.transactionId || null,
      expiresAt: result.expiresAt || null
    }
  } catch (error) {
    return {
      ok: false,
      mode: 'storekit',
      reason: 'native-error',
      message: error?.message || String(error)
    }
  }
}

export async function restorePurchases() {
  if (purchaseMode() !== 'storekit') {
    return { ok: false, reason: 'demo-local' }
  }
  try {
    const result = await LumaIap.restore()
    if (!result?.ok) return { ok: false, mode: 'storekit', reason: result?.reason || 'none' }
    const plan = planFromProductId(result.productId)
    if (!plan) return { ok: false, mode: 'storekit', reason: 'none' }
    return {
      ok: true,
      mode: 'storekit',
      plan,
      productId: result.productId,
      transactionId: result.transactionId || null,
      expiresAt: result.expiresAt || null
    }
  } catch (error) {
    return {
      ok: false,
      mode: 'storekit',
      reason: 'native-error',
      message: error?.message || String(error)
    }
  }
}

export const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions'
export const PRIVACY_PATH = './privacy.html'
export const TERMS_PATH = './terms.html'
