import bs58check from 'bs58check'
import KeyEncoder from 'key-encoder'
import { ec as EC } from 'elliptic'

const ec = new EC('secp256k1')
const keyEncoder = new KeyEncoder('secp256k1')

export function desoPublicKeyToPemEncodedPublicKey(
  desoPublicKey: string
): string {
  const decoded = bs58check.decode(desoPublicKey)
  const rawHex = ec
    .keyFromPublic(decoded.subarray(3), 'hex')
    .getPublic()
    .encode('hex', true)

  return keyEncoder.encodePublic(rawHex, 'raw', 'pem')
}

const PUBLIC_KEY_PREFIXES = {
  mainnet: {
    bitcoin: [0x00],
    deso: [0xcd, 0x14, 0x0],
  },
  testnet: {
    bitcoin: [0x6f],
    deso: [0x11, 0xc2, 0x0],
  },
}

export function seexHexToDeSoPublicKey(seedHex: string): string {
  const privateKey = ec.keyFromPrivate(seedHex)
  const prefix = PUBLIC_KEY_PREFIXES['mainnet'].deso
  const key = privateKey.getPublic().encode('array', true)
  const prefixAndKey = Uint8Array.from([...prefix, ...key])

  return bs58check.encode(prefixAndKey)
}
