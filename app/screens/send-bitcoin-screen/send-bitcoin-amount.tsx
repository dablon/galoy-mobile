import { useMySubscription, useWalletBalance } from "@app/hooks"
import useMainQuery from "@app/hooks/use-main-query"
import { palette } from "@app/theme"
import React, { useEffect, useMemo, useState } from "react"
import { StyleSheet, View, TouchableWithoutFeedback, TextInput } from "react-native"
import { Button, Text } from "react-native-elements"
import ReactNativeModal from "react-native-modal"
import { FakeCurrencyInput } from "react-native-currency-input"
import SwitchIcon from "@app/assets/icons/switch.svg"
import {
  fetchLnurlInvoice,
  GaloyGQL,
  PaymentType,
  translateUnknown as translate,
} from "@galoymoney/client"
import NoteIcon from "@app/assets/icons/note.svg"
import { satAmountDisplay, usdAmountDisplay } from "@app/utils/currencyConversion"
import Icon from "react-native-vector-icons/Ionicons"
import { LnUrlPayServiceResponse } from "lnurl-pay/dist/types/types"
import { utils } from "lnurl-pay"

const Styles = StyleSheet.create({
  sendBitcoinAmountContainer: {
    flex: 1,
  },
  fieldBackground: {
    flexDirection: "row",
    borderStyle: "solid",
    overflow: "hidden",
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 10,
    alignItems: "center",
    height: 60,
  },
  walletSelectorTypeContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    width: 50,
    marginRight: 20,
  },
  walletSelectorTypeLabelBitcoin: {
    height: 30,
    width: 50,
    borderRadius: 10,
    backgroundColor: "rgba(241, 164, 60, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelUsd: {
    height: 30,
    width: 50,
    backgroundColor: palette.usdSecondary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelUsdText: {
    fontWeight: "bold",
    color: palette.usdPrimary,
  },
  walletSelectorTypeLabelBtcText: {
    fontWeight: "bold",
    color: palette.btcPrimary,
  },
  walletSelectorInfoContainer: {
    flex: 1,
    flexDirection: "column",
  },
  walletTitleContainer: {
    flex: 1,
  },
  walletBalanceContainer: {
    flex: 1,
  },
  walletTypeText: {
    fontWeight: "bold",
    fontSize: 18,
    color: palette.lapisLazuli,
  },
  walletSelectorTypeTextContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  walletSelectorBalanceContainer: {
    flex: 1,
    flexDirection: "row",
  },
  walletBalanceText: {
    color: palette.midGrey,
  },
  fieldTitleText: {
    fontWeight: "bold",
    color: palette.lapisLazuli,
    marginBottom: 4,
  },
  fieldContainer: {},
  currencyInputContainer: {
    flexDirection: "column",
    flex: 1,
  },
  switchCurrencyIconContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  walletBalanceInput: {
    color: palette.lapisLazuli,
    fontSize: 20,
    fontWeight: "600",
  },
  convertedAmountText: {
    color: palette.coolGrey,
    fontSize: 12,
  },
  errorContainer: {
    marginVertical: 20,
    flex: 1,
  },
  errorText: {
    color: palette.red,
    textAlign: "center",
  },
  noteContainer: {
    flex: 1,
    flexDirection: "row",
  },
  noteIconContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  noteIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  noteInput: {
    flex: 1,
  },
  button: {
    marginTop: 20,
    height: 60,
    borderRadius: 10,
  },
  disabledButtonStyle: {
    backgroundColor: "rgba(83, 111, 242, 0.1)",
  },
  disabledButtonTitleStyle: {
    color: palette.lightBlue,
    fontWeight: "600",
  },
  activeButtonStyle: {
    backgroundColor: palette.lightBlue,
  },
  activeButtonTitleStyle: {
    color: palette.white,
    fontWeight: "bold",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 50,
  },
  modal: {
    marginBottom: "90%",
  },
  pickWalletIcon: {
    marginRight: 12,
  },
})

type SendBitcoinAmountProps = {
  nextStep: () => void
  defaultWallet: GaloyGQL.UsdWallet | GaloyGQL.BtcWallet
  fromWallet: GaloyGQL.UsdWallet | GaloyGQL.BtcWallet
  setFromWallet: (wallet: GaloyGQL.UsdWallet | GaloyGQL.BtcWallet) => void
  note: string
  setNote: (note: string) => void
  amountCurrency: string
  toggleAmountCurrency: () => void
  setAmount: (amount: number) => void
  defaultAmount: number
  fixedAmount: boolean
  usdDisabled: boolean
  lnurlParams: LnUrlPayServiceResponse
  paymentType: PaymentType
  setLnurlInvoice: (invoice: string) => void
  setFixedAmount: (boolean) => void
  destination: string
}

const SendBitcoinAmount = ({
  nextStep,
  defaultWallet,
  fromWallet,
  setFromWallet,
  note,
  setNote,
  amountCurrency,
  toggleAmountCurrency,
  setAmount,
  defaultAmount = 0,
  fixedAmount,
  usdDisabled,
  lnurlParams,
  paymentType,
  setLnurlInvoice,
  setFixedAmount,
  destination,
}: SendBitcoinAmountProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { wallets } = useMainQuery()
  const { usdWalletBalance, btcWalletBalance, btcWalletValueInUsd } = useWalletBalance()
  const [dollarAmount, setDollarAmount] = useState(0)
  const [satAmount, setSatAmount] = useState(0)
  const [satAmountInUsd, setSatAmountInUsd] = useState(0)
  const { convertCurrencyAmount } = useMySubscription()
  const [errorMessage, setErrorMessage] = useState("")
  const [validAmount, setValidAmount] = useState(false)

  const lnurlInvoiceAmount = useMemo(() => {
    if (fromWallet.walletCurrency === "BTC" && amountCurrency === "BTC") {
      return satAmount
    }
    if (fromWallet.walletCurrency === "BTC" && amountCurrency === "USD") {
      return Math.round(
        convertCurrencyAmount({
          amount: satAmountInUsd,
          from: "USD",
          to: "BTC",
        }),
      )
    }
    if (fromWallet.walletCurrency === "USD") {
      return Math.round(
        convertCurrencyAmount({
          amount: dollarAmount,
          from: "USD",
          to: "BTC",
        }),
      )
    }
    return 0
  }, [
    fromWallet,
    satAmount,
    satAmountInUsd,
    dollarAmount,
    amountCurrency,
    convertCurrencyAmount,
  ])

  useEffect(() => {
    if (defaultAmount) {
      setDollarAmount(defaultAmount)
      setSatAmountInUsd(defaultAmount)
    }
  }, [defaultAmount])

  useEffect(() => {
    setFromWallet(
      // Force from wallet to be BTC for onchain
      usdDisabled
        ? wallets.find((wallet) => wallet?.__typename === "BTCWallet")
        : defaultWallet,
    )
  }, [defaultWallet, setFromWallet, usdDisabled, wallets])

  useEffect(() => {
    if (amountCurrency === "USD") {
      setSatAmount(
        convertCurrencyAmount({
          amount: satAmountInUsd,
          from: "USD",
          to: "BTC",
        }),
      )
    }
    if (amountCurrency === "BTC") {
      setSatAmountInUsd(
        convertCurrencyAmount({
          amount: satAmount,
          from: "BTC",
          to: "USD",
        }),
      )
    }
  }, [satAmount, satAmountInUsd, amountCurrency, convertCurrencyAmount])

  useEffect(() => {
    if (fromWallet.__typename === "BTCWallet" && satAmount) {
      const isAmountValid = satAmount <= btcWalletBalance
      setValidAmount(isAmountValid)
      if (!isAmountValid) {
        setErrorMessage(
          translate("SendBitcoinScreen.amountExceed", {
            balance: satAmountDisplay(btcWalletBalance),
          }),
        )
      }
    }
    if (fromWallet.__typename === "UsdWallet" && dollarAmount) {
      const isAmountValid = 100 * dollarAmount <= usdWalletBalance
      setValidAmount(isAmountValid)
      if (!isAmountValid) {
        setErrorMessage(
          translate("SendBitcoinScreen.amountExceed", {
            balance: usdAmountDisplay(usdWalletBalance / 100),
          }),
        )
      }
    }
  }, [fromWallet, satAmount, dollarAmount, btcWalletBalance, usdWalletBalance])

  if (!defaultWallet) {
    return <></>
  }

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible)
  }

  const chooseWalletModal = (
    <ReactNativeModal
      style={Styles.modal}
      animationIn="fadeInDown"
      animationOut="fadeOutUp"
      isVisible={isModalVisible}
      onBackButtonPress={() => toggleModal()}
    >
      <View>
        {wallets?.map((wallet) => {
          return (
            <TouchableWithoutFeedback
              key={wallet.id}
              onPress={() => {
                setFromWallet(wallet)
                toggleModal()
              }}
            >
              <View style={Styles.fieldBackground}>
                <View style={Styles.walletSelectorTypeContainer}>
                  <View
                    style={
                      wallet.__typename === "BTCWallet"
                        ? Styles.walletSelectorTypeLabelBitcoin
                        : Styles.walletSelectorTypeLabelUsd
                    }
                  >
                    {wallet.__typename === "BTCWallet" ? (
                      <Text style={Styles.walletSelectorTypeLabelBtcText}>BTC</Text>
                    ) : (
                      <Text style={Styles.walletSelectorTypeLabelUsdText}>USD</Text>
                    )}
                  </View>
                </View>
                <View style={Styles.walletSelectorInfoContainer}>
                  <View style={Styles.walletSelectorTypeTextContainer}>
                    {wallet.__typename === "BTCWallet" ? (
                      <>
                        <Text style={Styles.walletTypeText}>Bitcoin Wallet</Text>
                      </>
                    ) : (
                      <>
                        <Text style={Styles.walletTypeText}>US Dollar Wallet</Text>
                      </>
                    )}
                  </View>
                  <View style={Styles.walletSelectorBalanceContainer}>
                    {wallet.__typename === "BTCWallet" ? (
                      <>
                        <Text style={Styles.walletBalanceText}>
                          {usdAmountDisplay(btcWalletValueInUsd)}
                          {" - "}
                          {satAmountDisplay(btcWalletBalance)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={Styles.walletBalanceText}>
                          {usdAmountDisplay(usdWalletBalance / 100)}
                        </Text>
                      </>
                    )}
                  </View>
                  <View />
                </View>
              </View>
            </TouchableWithoutFeedback>
          )
        })}
      </View>
    </ReactNativeModal>
  )

  const showWalletPicker = !usdDisabled && wallets.length > 1

  return (
    <View style={Styles.sendBitcoinAmountContainer}>
      <View style={Styles.fieldContainer}>
        <Text style={Styles.fieldTitleText}>{translate("common.from")}</Text>
        <TouchableWithoutFeedback onPress={() => showWalletPicker && toggleModal()}>
          <View style={Styles.fieldBackground}>
            <View style={Styles.walletSelectorTypeContainer}>
              <View
                style={
                  fromWallet.__typename === "BTCWallet"
                    ? Styles.walletSelectorTypeLabelBitcoin
                    : Styles.walletSelectorTypeLabelUsd
                }
              >
                {fromWallet.__typename === "BTCWallet" ? (
                  <Text style={Styles.walletSelectorTypeLabelBtcText}>BTC</Text>
                ) : (
                  <Text style={Styles.walletSelectorTypeLabelUsdText}>USD</Text>
                )}
              </View>
            </View>
            <View style={Styles.walletSelectorInfoContainer}>
              <View style={Styles.walletSelectorTypeTextContainer}>
                {fromWallet.__typename === "BTCWallet" ? (
                  <>
                    <Text style={Styles.walletTypeText}>Bitcoin Wallet</Text>
                  </>
                ) : (
                  <>
                    <Text style={Styles.walletTypeText}>US Dollar Wallet</Text>
                  </>
                )}
              </View>
              <View style={Styles.walletSelectorBalanceContainer}>
                {fromWallet.__typename === "BTCWallet" ? (
                  <>
                    <Text style={Styles.walletBalanceText}>
                      {usdAmountDisplay(btcWalletValueInUsd)}
                      {" - "}
                      {satAmountDisplay(btcWalletBalance)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={Styles.walletBalanceText}>
                      {usdAmountDisplay(usdWalletBalance / 100)}
                    </Text>
                  </>
                )}
              </View>
              <View />
            </View>

            {!usdDisabled && (
              <View style={Styles.pickWalletIcon}>
                <Icon name={"chevron-down"} size={24} color={palette.lightBlue} />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
        {chooseWalletModal}
      </View>
      <View style={Styles.fieldContainer}>
        <Text style={Styles.fieldTitleText}>{translate("SendBitcoinScreen.amount")}</Text>
        <View style={Styles.fieldBackground}>
          <View style={Styles.currencyInputContainer}>
            {fromWallet.__typename === "BTCWallet" && amountCurrency === "BTC" && (
              <>
                <FakeCurrencyInput
                  value={satAmount}
                  onChangeValue={setSatAmount}
                  prefix=""
                  delimiter=","
                  separator="."
                  precision={0}
                  suffix=" sats"
                  minValue={0}
                  editable={!fixedAmount}
                  style={Styles.walletBalanceInput}
                />
                <FakeCurrencyInput
                  value={satAmountInUsd}
                  onChangeValue={setSatAmountInUsd}
                  prefix="$"
                  delimiter=","
                  separator="."
                  precision={2}
                  editable={false}
                  style={Styles.convertedAmountText}
                />
              </>
            )}
            {fromWallet.__typename === "BTCWallet" && amountCurrency === "USD" && (
              <>
                <FakeCurrencyInput
                  value={satAmountInUsd}
                  onChangeValue={setSatAmountInUsd}
                  prefix="$"
                  delimiter=","
                  separator="."
                  precision={2}
                  style={Styles.walletBalanceInput}
                  minValue={0}
                  editable={!fixedAmount}
                />
                <FakeCurrencyInput
                  value={satAmount}
                  onChangeValue={setSatAmount}
                  prefix=""
                  delimiter=","
                  separator="."
                  suffix=" sats"
                  precision={0}
                  editable={false}
                  style={Styles.convertedAmountText}
                />
              </>
            )}
            {fromWallet.__typename === "UsdWallet" && (
              <FakeCurrencyInput
                value={dollarAmount}
                onChangeValue={setDollarAmount}
                prefix="$"
                delimiter=","
                separator="."
                precision={2}
                minValue={0}
                style={Styles.walletBalanceInput}
                editable={!fixedAmount}
              />
            )}
          </View>
          {fromWallet.__typename === "BTCWallet" && (
            <TouchableWithoutFeedback onPress={toggleAmountCurrency}>
              <View style={Styles.switchCurrencyIconContainer}>
                <SwitchIcon />
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
        {lnurlParams && (
          <Text>
            Min:{" "}
            {fromWallet.__typename === "UsdWallet"
              ? convertCurrencyAmount({
                  amount: lnurlParams.min,
                  from: "BTC",
                  to: "USD",
                })
              : lnurlParams.min}{" "}
            - Max:{" "}
            {fromWallet.__typename === "UsdWallet"
              ? convertCurrencyAmount({
                  amount: lnurlParams.max,
                  from: "BTC",
                  to: "USD",
                })
              : lnurlParams.max}
          </Text>
        )}
      </View>
      <View style={Styles.fieldContainer}>
        <Text style={Styles.fieldTitleText}>{translate("SendBitcoinScreen.note")}</Text>
        <View style={Styles.fieldBackground}>
          <View style={Styles.noteContainer}>
            <View style={Styles.noteIconContainer}>
              <NoteIcon style={Styles.noteIcon} />
            </View>
            <TextInput
              style={Styles.noteInput}
              placeholder={translate("SendBitcoinScreen.note")}
              onChangeText={setNote}
              value={note}
              selectTextOnFocus
              maxLength={lnurlParams ? lnurlParams.commentAllowed : 500}
            />
          </View>
        </View>
      </View>

      {Boolean(errorMessage) && (
        <View style={Styles.errorContainer}>
          <Text style={Styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={Styles.buttonContainer}>
        <Button
          title={translate("common.next")}
          buttonStyle={[Styles.button, Styles.activeButtonStyle]}
          titleStyle={Styles.activeButtonTitleStyle}
          disabledStyle={[Styles.button, Styles.disabledButtonStyle]}
          disabledTitleStyle={Styles.disabledButtonTitleStyle}
          disabled={!validAmount}
          onPress={async () => {
            if (fromWallet.__typename === "UsdWallet") {
              setAmount(dollarAmount)
            }
            if (fromWallet.__typename === "BTCWallet" && amountCurrency === "USD") {
              setAmount(satAmountInUsd)
            }
            if (fromWallet.__typename === "BTCWallet" && amountCurrency === "BTC") {
              setAmount(satAmount)
            }
            if (paymentType === "lnurl") {
              try {
                const { invoice } = await fetchLnurlInvoice({
                  lnUrlOrAddress: destination,
                  tokens: utils.toSats(lnurlInvoiceAmount),
                })
                setLnurlInvoice(invoice)
                setFixedAmount(true)
              } catch (error) {
                console.error(error)
                setErrorMessage(translate("SendBitcoinScreen.failedToFetchLnurlInvoice"))
                return
              }
            }
            nextStep()
          }}
        />
      </View>
    </View>
  )
}

export default SendBitcoinAmount
