import React from 'react'

export interface Props {
  format?: string,
  children: string,
}
const decoder = new TextDecoder('utf-8')

const IS_NON_PRINTABLE_ASCII_CHARACTER = /[^ -~\u0007\b\t\n\r]/

function decimalToHexString(d: number, padding = 2) {
  const hex = Number(d).toString(16)
  return '0'.repeat(padding).substr(0, padding - hex.length) + hex
}

const getASCIISafeStringFromBuffer = (reply: number[]) => {
  let result = ''
  reply.forEach((byte: number) => {
    const char = decoder.decode(new Uint8Array([byte]))
    if (IS_NON_PRINTABLE_ASCII_CHARACTER.test(char)) {
      result += `\\x${decimalToHexString(byte)}`
    } else {
      switch (char) {
        case '\u0007': // Bell character
          result += '\\a'
          break
        case '\\':
          result += '\\\\'
          break
        case '"':
          result += '\\"'
          break
        case '\b':
          result += '\\b'
          break
        case '\t':
          result += '\\t'
          break
        case '\n':
          result += '\\n'
          break
        case '\r':
          result += '\\r'
          break
        default:
          result += char
      }
    }
  })
  return result
}

const Formatter = (props: Props) => {
  let wheelTimer = 0
  let { format, children } = props
  let string = children

  if (children?.type === 'Buffer') {
    const buffer = children.data.slice(0, 200)
    string = getASCIISafeStringFromBuffer(buffer)
  } else {
    string = string.substring(0, 200)
  }

  return (
    <>
      {string}
    </>
  )
}

export default Formatter
