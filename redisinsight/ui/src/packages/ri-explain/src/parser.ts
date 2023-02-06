import { v4 as uuidv4 } from 'uuid'

enum TokenType {

  INIT = 'INIT',

  EOF = 'EOF',
  ILLEGAL = 'ILLEGAL',

  UNION = 'UNION',
  INTERSECT = 'INTERSECT',
  TAG_EXPR = 'TAG_EXPR',
  NUMERIC = 'NUMERIC',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LPAREN = 'LAPAREN',
  RPAREN = 'RAPAREN',
  NUMBER = 'NUMBER',
  NEW_LINE = 'NEW_LINE',

  PLUS = 'PLUS',
  MINUS = 'MINUS',

  LESS = 'LESS',
  GREATER = 'GREATER',

  EQUAL = 'EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',

  IDENTIFIER = 'IDENTIFIER',
}

class Token {
    T: TokenType
    Data: string

    constructor(t: TokenType, data: string) {
        this.T = t
        this.Data = data
    }

}

const KEYWORDS = {
  [TokenType.EOF.toString()]: TokenType.EOF,
  [TokenType.ILLEGAL.toString()]: TokenType.ILLEGAL,

  [TokenType.UNION.toString()]: TokenType.UNION,
  [TokenType.TAG_EXPR.toString()]: TokenType.TAG_EXPR,
  [TokenType.INTERSECT.toString()]: TokenType.INTERSECT,
  [TokenType.NUMERIC.toString()]: TokenType.NUMERIC,

  'inf': TokenType.NUMBER,
}

class Lexer {
  Input: string
  Position: number
  ReadPosition: number

  C?: string

  constructor(input: string) {
    this.Input = input
    this.Position = 0
    this.ReadPosition = 0
    this.C = undefined

    this.ReadChar()
  }

  ReadChar() {
    if (this.ReadPosition >= this.Input.length) {
      this.C = undefined
    } else {
      this.C = this.Input[this.ReadPosition]
    }
    this.Position = this.ReadPosition++
  }
  
  PeekChar() {
    if (this.ReadPosition >= this.Input.length) {
      return null
    } else {
      return this.Input[this.ReadPosition]
    }
  }

  SkipWhitespace() {
    while (this.C == ' ' || this.C == '\t' || this.C == '\r') {
      this.ReadChar()
    }
  }

  ReadIdentifier(): string {
    let str = ''

    while (this.C !== undefined && (isLetter(this.C) || ['@', ':'].includes(this.C))) {
      str = str + this.C
      this.ReadChar()
    }

    return str
  }

  ReadNumber(): string {
    let str = ''
    while (this.C !== undefined && (isDigit(this.C) || this.C === '.') && parseFloat(str + this.C) != NaN) {
      str = str + this.C
      this.ReadChar()
    }
    return str
  }

  NextToken() {
    let t: Token | null = null

    this.SkipWhitespace()

    switch (this.C) {
      case '\n':
        t = new Token(TokenType.NEW_LINE, this.C)
        break
      case '{':
        t = new Token(TokenType.LBRACE, this.C)
        break
      case '}':
        t = new Token(TokenType.RBRACE, this.C)
        break
      case '(':
        t = new Token(TokenType.LPAREN, this.C)
        break
      case ')':
        t = new Token(TokenType.RPAREN, this.C)
        break
      case '+':// TODO: This should be PLUS token
        t = new Token(TokenType.IDENTIFIER, this.C)
        break
      case '-':// TODO: This should be MINUS token
        t = new Token(TokenType.IDENTIFIER, this.C)
        break
      case '<':
        let lPeekChar = this.PeekChar()
        if (lPeekChar !== null && lPeekChar === '=') {
          t = new Token(TokenType.LESS_EQUAL, '<=')
          this.ReadChar()
        } else {
          t = new Token(TokenType.LESS, '<')
        }
        break
      case '>':
        let rPeekChar = this.PeekChar()
        if (rPeekChar !== null && rPeekChar === '=') {
          t = new Token(TokenType.GREATER_EQUAL, '>=')
          this.ReadChar()
        } else {
          t = new Token(TokenType.GREATER, '>')
        }
        break
      case '=':
        let ePeekChar = this.PeekChar()
        if (ePeekChar !== null && ePeekChar === '=') {
          t = new Token(TokenType.EQUAL, '==')
          this.ReadChar()
        } else {
          // No Assign Token
          t = new Token(TokenType.ILLEGAL, this.C)
        }
        break
      case undefined:
        t = new Token(TokenType.EOF, '')
        break
      default:
        if (this.C !== undefined && (isLetter(this.C) || ['@', ':'].includes(this.C))) {
          const literal = this.ReadIdentifier()
          let tokenType = KEYWORDS[literal] || TokenType.IDENTIFIER

          if (literal.startsWith('TAG:')) {
            tokenType = TokenType.TAG_EXPR
          } else if (literal.startsWith('@') && literal.endsWith(':UNION')) {
            tokenType = TokenType.UNION
          } else if (literal.startsWith('@') && literal.endsWith(':INTERSECT')) {
            tokenType = TokenType.INTERSECT
          }
          t = new Token(tokenType, literal)
          return t
        } else if (this.C !== undefined && isDigit(this.C)) {
          const n = this.ReadNumber()
          t = new Token(TokenType.NUMBER, n)
          return t
        } else {
          t = new Token(TokenType.ILLEGAL, this.C)
        }
    }
    this.ReadChar()
    return t
  }
}

export enum EntityType {
  Expr = 'Expr',
  UNION = 'UNION',
  INTERSECT = 'INTERSECT',
  NUMERIC = 'NUMERIC',

  // These are used exclusively in FT.PROFILE
  GEO = 'GEO',
  TEXT = 'TEXT',
  TAG = 'TAG',

  Index = 'Index',
  Scorer = 'Scorer',
  Sorter = 'Sorter',
  Loader = 'Loader',

  CLUSTER_MERGE = 'CLUSTER MERGE'
}


export interface EntityInfo {
  id: string
  type: EntityType,
  subType?: EntityType,
  data?: string
  snippet?: string
  children: EntityInfo[]
  time?: string
  counter?: string
  size?: string
  parentId?: string
  parentSnippet?: string
  level?: number
  recordsProduced?: string
}

interface IAncestors {
  found: boolean
  pairs: [string, string][]
}

export function GetAncestors(info: EntityInfo, searchId: string, a: IAncestors): IAncestors {
  if (searchId === info.id) {
    return {
      found: true,
      pairs: info.parentId ? [[info.parentId, info.id]] : []
    }
  } else {
    let r: IAncestors = {...a}
    for (let i = 0; i < info.children.length; i++) {
      let c = info.children[i]
      let ci = GetAncestors(c, searchId, a)
      if (ci.found) {
        r.found = true
        r.pairs = [...a.pairs, ...ci.pairs]
        if (info.parentId) {
          r.pairs = [...r.pairs, [info.parentId, info.id]]
        }
        return r
      }
    }
    return r
  }
}


class Expr {
  Core: string
  Type: EntityType
  SubType: EntityType
  Time?: string
  Info?: string

  constructor(expr: string, subType: EntityType, info: string | undefined = undefined) {
    this.Core = expr
    this.SubType = subType
    this.Info = info
  }

  toJSON(): EntityInfo {

    let snippet: string | undefined = undefined

    if (this.SubType === EntityType.TAG && this.Info?.startsWith('TAG:')) {
      snippet = this.Info?.substr(4)
    }

    return {
      id: uuidv4(),
      // data: 'Expr',
      // snippet: this.Core,
      type: EntityType.Expr,
      subType: this.SubType,
      snippet: snippet,
      data: this.Core,
      children: [],
      time: this.Time,
    }
  }
}

class NumericExpr {
  Left: number
  LSign: Token

  Identifier: Token

  Right: number
  RSign: Token


  constructor(left: number, lsign: Token, identifier: Token, rsign: Token, right: number) {
    this.Left = left
    this.LSign = lsign
    this.Identifier = identifier
    this.Right = right
    this.RSign = rsign
  }

  toJSON(): EntityInfo {
    return {
      id: uuidv4(),
      type: EntityType.NUMERIC,
      data: 'Numeric',
      snippet: `${this.Left.toString()} ${this.LSign.Data} ${this.Identifier.Data} ${this.RSign.Data} ${this.Right.toString()}`,
      children: [],
    }
  }
}

type SearchExpr = IntersectExpr | UnionExpr | NumericExpr | Expr

type ExprTuple2 = SearchExpr[]

class IntersectExpr {
  Core: ExprTuple2
  Info?: string

  constructor(e: ExprTuple2, info?: string) {
    this.Core = e
    this.Info = info
  }

  toJSON(): EntityInfo {
    const id = uuidv4()

    let snippet: string | undefined = undefined

    if (!this.Info?.startsWith('INTERSECT')) {
      snippet = this.Info?.substring(0, this.Info.indexOf(':INTERSECT'))
    }

    return {
      id,
      type: EntityType.INTERSECT,
      snippet,
      children: this.Core.map(x => x.toJSON()).map((d: EntityInfo) => ({...d, parentId: id, parentSnippet: snippet})),
    }
  }
}

class UnionExpr {
  Info?: string
  Core: ExprTuple2

  constructor(e: ExprTuple2, info?: string) {
    this.Core = e
    this.Info = info
  }

  toJSON(): EntityInfo {
    const id = uuidv4()

    let snippet: string | undefined = undefined

    if (!this.Info?.startsWith('UNION')) {
      snippet = this.Info?.substring(0, this.Info.indexOf(':UNION'))
    }

    return {
      id,
      type: EntityType.UNION,
      snippet,
      children: this.Core.map(x => x.toJSON()).map((d: EntityInfo) => ({...d, parentId: id, parentSnippet: snippet}))
    }
  }
}


class Parser {
  private L: Lexer
  CurrentToken: Token
  PeekToken: Token
  Errors: string[]

  constructor(l: Lexer) {
    this.L = l
    
    this.Errors = []
    this.CurrentToken = new Token(TokenType.INIT, '')
    this.PeekToken = new Token(TokenType.INIT, '')

    this.nextToken()
    this.nextToken()
  }

  currentTokenIs(t: TokenType) {
    return this.CurrentToken?.T === t
  }

  peekTokenIs(t: TokenType) {
    return this.PeekToken?.T === t
  }

  nextToken() {
    this.CurrentToken = this.PeekToken
    this.PeekToken = this.L.NextToken()

    if (this.CurrentToken.T === TokenType.EOF) {
      throw new Error("Didn't expect EOF token")
    }
  }

  parseIntersectExpr(): IntersectExpr {

    assertToken(TokenType.INTERSECT, this.CurrentToken?.T)

    let intersectData = this.CurrentToken.Data

    this.nextToken()

    assertToken(TokenType.LBRACE, this.CurrentToken?.T)

    let Exprs: SearchExpr[] = []
    this.nextToken()

    assertToken(TokenType.NEW_LINE, this.CurrentToken?.T)

    this.nextToken()

    while (true) {

      if (this.CurrentToken.T === TokenType.RBRACE && this.PeekToken.T === TokenType.NEW_LINE) {
        this.nextToken()
        break
      }

      if (this.CurrentToken?.T === TokenType.NUMERIC) {
        Exprs.push(this.parseNumericExpr())
      } else if (this.CurrentToken?.T === TokenType.IDENTIFIER) {
        Exprs.push(this.parseExpr())
      } else if (this.CurrentToken?.T === TokenType.UNION) {
        Exprs.push(this.parseUnionExpr())
      } else if (this.CurrentToken.T === TokenType.INTERSECT) {
        Exprs.push(this.parseIntersectExpr())
      } else if (this.CurrentToken.T === TokenType.TAG_EXPR) {
        Exprs.push(this.parseTagExpr())
      }

      this.nextToken()
    }

    return new IntersectExpr(Exprs, intersectData)
  }


  parseUnionExpr(): UnionExpr {

    assertToken(TokenType.UNION, this.CurrentToken?.T)

    let unionData = this.CurrentToken.Data

    this.nextToken()

    assertToken(TokenType.LBRACE, this.CurrentToken.T)

    let Exprs: SearchExpr[] = []
    this.nextToken()

    assertToken(TokenType.NEW_LINE, this.CurrentToken?.T)

    this.nextToken()

    while (true) {

      if (this.CurrentToken.T === TokenType.RBRACE && this.PeekToken.T === TokenType.NEW_LINE) {

        this.nextToken()
        break
      }

      if (this.CurrentToken?.T === TokenType.NUMERIC) {
        Exprs.push(this.parseNumericExpr())
      } else if (this.CurrentToken?.T === TokenType.IDENTIFIER) {
        Exprs.push(this.parseExpr())
      } else if (this.CurrentToken?.T === TokenType.UNION) {
        Exprs.push(this.parseUnionExpr())
      } else if (this.CurrentToken.T === TokenType.INTERSECT) {
        Exprs.push(this.parseIntersectExpr())
      } else if (this.CurrentToken.T === TokenType.TAG_EXPR) {
        Exprs.push(this.parseTagExpr())
      }

      this.nextToken()
    }

    return new UnionExpr(Exprs, unionData)
  }

  parseExpr() {

    assertToken(TokenType.IDENTIFIER, this.CurrentToken.T)

    let str = ''

    while (this.CurrentToken.T !== TokenType.NEW_LINE) {
      str = str + this.CurrentToken.Data
      this.nextToken()
    }

    return new Expr(str, EntityType.TEXT)
  }

  parseTagExpr() {
    assertToken(TokenType.TAG_EXPR, this.CurrentToken.T)

    let tagData = this.CurrentToken.Data

    this.nextToken()

    assertToken(TokenType.LBRACE, this.CurrentToken.T)

    this.nextToken()

    assertToken(TokenType.NEW_LINE, this.CurrentToken?.T)

    this.nextToken()

    assertToken(TokenType.IDENTIFIER, this.CurrentToken?.T)

    let identifier = this.CurrentToken.Data

    this.nextToken()

    assertToken(TokenType.NEW_LINE, this.CurrentToken?.T)

    this.nextToken()

    assertToken(TokenType.RBRACE, this.CurrentToken?.T)

    this.nextToken()

    return new Expr(identifier, EntityType.TAG, tagData)

  }

  parseNumericExpr() {
    assertToken(TokenType.NUMERIC, this.CurrentToken.T)

    this.nextToken()

    assertToken(TokenType.LBRACE, this.CurrentToken.T)

    this.nextToken()

    assertToken(TokenType.NUMBER, this.CurrentToken?.T)

    let left = this.CurrentToken?.Data

    this.nextToken()

    let lsign = this.CurrentToken // TODO: Check sign

    this.nextToken()

    assertToken(TokenType.IDENTIFIER, this.CurrentToken?.T)

    let identifier = this.CurrentToken

    this.nextToken()

    while (this.CurrentToken.T === TokenType.IDENTIFIER) {
      identifier.Data = identifier.Data + this.CurrentToken.Data
      this.nextToken()
    }


    let rsign = this.CurrentToken

    this.nextToken()


    assertToken(TokenType.NUMBER, this.CurrentToken?.T)

    let right = this.CurrentToken?.Data

    this.nextToken()


    assertToken(TokenType.RBRACE, this.CurrentToken?.T)

    this.nextToken()// read off RBRACE

    // assertToken(TokenType.NEW_LINE, this.CurrentToken?.T)
    // 
    // this.nextToken() // read off new line

    return new NumericExpr(left !== 'inf' ? parseFloat(left) : Infinity, lsign, identifier, rsign, right !== 'inf' ? parseFloat(right) : Infinity)
  }
}


function Parse(data: string): SearchExpr {
  const l = new Lexer(data)

  let p = new Parser(l)
  
  if (p.CurrentToken?.T === TokenType.INTERSECT) {
    return p.parseIntersectExpr()
  } else if (p.CurrentToken?.T === TokenType.NUMERIC) {
    return p.parseNumericExpr()
  } else if (p.CurrentToken.T === TokenType.UNION) {
    return p.parseUnionExpr()
  } else if (p.CurrentToken.T === TokenType.TAG_EXPR) {
    return p.parseTagExpr()
  } else {
    return p.parseExpr()
  }
}

export function ParseExplain(output: string) {
  return Parse(output).toJSON()
}


function isLetter(str: string): boolean {
  return str.length === 1 && (str.match(/[a-z]/i) !== null)
}

function isDigit(str: string): boolean {
  return str >='0' && str <= '9'
}


function assert(c: boolean, errorMsg: string) {
  if (!c) {
    throw new Error(errorMsg)
  }
}

function assertToken(expected: TokenType, actual: TokenType | undefined) {


  if (actual === undefined) {
    throw new Error("Token is undefined")
  }

  assert(expected === actual, `Expected ${expected}, Actual: ${actual}`)
}


export function ParseProfileCluster(info: any[]): [Object, EntityInfo] {

  let clusterInfo: {[key: string]: any[]} = {}
  let key: string = ''
  let i = 0
  while (i < info.length) {
    if (Array.isArray(info[i])) {
      clusterInfo[key].push(info[i])
    } else if (typeof(info[i]) === 'string') {
      key = info[i]
      clusterInfo[key] = []
    } else {
      throw new Error("Expected array or string - " + JSON.stringify(info))
    }
    i++
  }

  let shards: EntityInfo[] = []

  Object.keys(clusterInfo).map(k => {
    if (k.toLowerCase().startsWith('shard')) {
      let shardProfileInfo = ParseProfile(clusterInfo[k])
      shards.push({
        id: uuidv4(),
        type: k as EntityType,
        children: [shardProfileInfo],
      })
    }
  })

  return [
    clusterInfo,
    {
      id: uuidv4(),
      type: EntityType.CLUSTER_MERGE,
      // children: shards,
      children: Object.keys(clusterInfo).filter(k => k.toLowerCase().startsWith('shard')).map(k =>
        ParseProfile(clusterInfo[k])
      )
    }
  ]
}

export function ParseProfile(info: any[][]): EntityInfo {
  const parserData: any = info[info.length - 2]
  let resp = ParseIteratorProfile(parserData[1])

  const processorsProfile: string[][] = info[info.length - 1].slice(1)

  for (let i = 0; i < processorsProfile.length; i++) {
    const e = processorsProfile[i]
    let id = uuidv4()
    resp = {
      id,
      type: e[1] as EntityType,
      time: e[3],
      counter: e[5],
      children: [{...resp, parentId: id}],
    }
  }

  return resp
}

export function ParseIteratorProfile(data: any[]): EntityInfo {

  let props: {[key: string]: any} = {}

  // Parse items with the following format [key1, value1, key2, value2, null, key3, value3, key4, value4_1[], value4_2[]]
  for (let x = 0; x < data.length; x += 2) {
    let key = data[x]
    if (key === null) {

      while (data[x] === null) {
        x = x + 1
      }
      key = data[x]
    }

    let val = data[x + 1]

    while (data[x + 1] === null) x = x + 1
    val = data[x + 1]

    if (Array.isArray(val)) {
      let arr: any[] = []
      while ((x + 1) < data.length && Array.isArray(data[x + 1])) {
        arr.push(data[x + 1])
        x = x + 1
      }
      props[key] = arr
    } else {
      props[key] = val
    }
  }

  let childrens = props['Child iterators'] || props['Child Iterators'] || []

  const id = uuidv4()
  return {
    id,
    type: props['Type'] || props['TYPE'],
    time: props['Time'],
    counter: props['Counter'],
    size: props['Size'],
    data: props['Term'],
    children: childrens.map(ParseIteratorProfile).map((d: EntityInfo) => ({...d, parentId: id})),
  }

  // const t: EntityType = props['Type']
  // if ([EntityType.UNION, EntityType.INTERSECT].includes(t)) {
  //   const l = data.length

  //   return {
  //     id: uuidv4(),
  //     type: t,
  //     time: data[5],
  //     counter: data[7],
  //     children: props['Child iterators'].map(x => ParseIteratorProfile(x)),
  //   }
  // // } else if (t === EntityType.NUMERIC) {
  // //   return {
  // //     id: uuidv4(),
  // //     type: EntityType.NUMERIC,
  // //     snippet: 'Numeric',
  // //     children: [],
  // //   }
  // } else {
  //   return {
  //     id: uuidv4(),
  //     type: data[1],
  //     data: data[3],
  //     time: data[5],
  //     counter: data[7],
  //     size: data[9],
  //     children: [],
  //   }
  // }
}

export enum ModuleType {
  Graph,
  Search,
}

export enum CoreType {
  Profile,
  Explain,
}

export function getOutputLevel(output: string) {
  let i = 0
  while (output[i] == ' ' && i < output.length) {
    i++
  }
  return (i > 0 ? i / 4 : 0) + 1
}

function ParseEntity(entity: string, children: EntityInfo[]): EntityInfo {
  const info = entity.trim().split('|')

  let time: string | undefined = '', size: string | undefined = ''

  const metaData = info.slice(-1)[0].trim()

  // Is GRAPH.PROFILE output
  if (metaData.startsWith('Records produced')) {

    [size, time] = metaData.trim().split(',')

    size = size.split(': ')[1]
    time = time.split(': ')[1].split(' ')[0]
    info.pop()
  }

  const snippet = [...info.slice(1)].join('|').trim()

  return {
    id: uuidv4(),
    type: info[0] as EntityType,
    snippet,
    children,
    time,
    size,
    counter: size,
    level: getOutputLevel(entity),
  }
}


export function ParseGraphV2(output: string[]) {

  const level = getOutputLevel(output[0]) + 1

  let entity = ParseEntity(output[0], [])
  let children: EntityInfo[] = []

  let pairs: [number, number][] = []
    
  let s: number | null = null, e: number | null = null
  let i = 1

  while (i < output.length) {
    let l = getOutputLevel(output[i])
    if (l === level) {
      if (s == null) {
        s = i
      } else if (s != null) {
        pairs.push([s, i])
        s = i
      }
    }
    i++
  }

  if (s !== null) {
    pairs.push([s, i])
  }

  for (let k = 0; k < pairs.length; k++) {
    let p = pairs[k]
    children.push({...ParseGraphV2(output.slice(p[0], p[1])), parentId: entity.id})
  }

  entity.children = children
  return entity
}


export function GetTotalExecutionTime(g: EntityInfo) {
  return parseFloat(g.time || '') + g.children.reduce((a, c) => a + GetTotalExecutionTime(c), 0)
}