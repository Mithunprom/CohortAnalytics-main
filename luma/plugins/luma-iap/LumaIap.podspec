require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'LumaIap'
  s.version = package['version']
  s.summary = 'StoreKit 2 purchases for Luma Plus'
  s.license = 'MIT'
  s.homepage = 'https://github.com/Mithunprom/CohortAnalytics-main'
  s.author = 'Luma'
  s.source = { :git => 'https://github.com/Mithunprom/CohortAnalytics-main.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m}'
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.9'
  s.frameworks = 'StoreKit'
end
