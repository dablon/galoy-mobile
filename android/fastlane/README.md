fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew install fastlane`

# Available Actions
## Android
### android test
```
fastlane android test
```
Runs all the tests
### android build
```
fastlane android build
```
Submit a new Beta Build to Crashlytics Beta
### android beta
```
fastlane android beta
```
Deploy a new version to both Play Store and Huawei Store
### android play_store_release
```
fastlane android play_store_release
```
Deploy a new version to the Google Play
### android huawei_release
```
fastlane android huawei_release
```
Deploy a new version to Huawei App Gallery
### android browserstack
```
fastlane android browserstack
```
End to end testing on browserstack
### android build_e2e
```
fastlane android build_e2e
```
Build for end to end testing

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
