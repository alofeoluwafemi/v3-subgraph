import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { PoolCreated } from '../types/Factory/Factory'
import { Factory } from '../types/schema'
import { Bundle, Pool, Token } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { STATIC_TOKEN_DEFINITIONS, StaticTokenDefinition } from '../utils/staticTokenDefinition'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from '../utils/token'
import { ADDRESS_ZERO, FACTORY_ADDRESS, ONE_BI, ZERO_BD, ZERO_BI } from './../utils/constants'
import { WHITELIST_TOKENS } from './../utils/pricing'
import { populateEmptyPools } from '../utils/backfill'

// The subgraph handler must have this signature to be able to handle events,
// however, we invoke a helper in order to inject dependencies for unit tests.
export function handlePoolCreated(event: PoolCreated): void {
<<<<<<< HEAD
  handlePoolCreatedHelper(event)
}

// Exported for unit tests
export function handlePoolCreatedHelper(
  event: PoolCreated,
  factoryAddress: string = FACTORY_ADDRESS,
  whitelistTokens: string[] = WHITELIST_TOKENS,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS,
): void {
  // temp fix
  if (event.params.pool == Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248')) {
=======
  // fix for pool overflow - this pool has a token that overflows on one of its values, but theres no way in
  // assembly ts to error catch for this.
  // Transaction - https://optimistic.etherscan.io/tx/0x16312a52237ce08e4bb7534648f4c8da6cd4c192f0b955cf6770b2d347f19d2b
  if (
    event.params.pool === Address.fromHexString('0x282b7d6bef6c78927f394330dca297eca2bd18cd') ||
    event.params.pool === Address.fromHexString('0x5738de8d0b864d5ef5d65b9e05b421b71f2c2eb4') ||
    event.params.pool === Address.fromHexString('0x5500721e5a063f0396c5e025a640e8491eb89aac') ||
    event.params.pool === Address.fromHexString('0x1ffd370f9d01f75de2cc701956886acec9749e80')
  ) {
>>>>>>> 3b4a84e (update network to optimism)
    return
  }

  // load factory
  let factory = Factory.load(factoryAddress)
  if (factory === null) {
    factory = new Factory(factoryAddress)
    factory.poolCount = ZERO_BI
    factory.totalVolumeETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesETH = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.totalValueLockedETHUntracked = ZERO_BD
    factory.txCount = ZERO_BI
    factory.owner = ADDRESS_ZERO

    // create new bundle for tracking eth price
    const bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()

    populateEmptyPools(event)
  }

  factory.poolCount = factory.poolCount.plus(ONE_BI)

  const pool = new Pool(event.params.pool.toHexString()) as Pool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0, staticTokenDefinitions)
    token0.name = fetchTokenName(event.params.token0, staticTokenDefinitions)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    const decimals = fetchTokenDecimals(event.params.token0, staticTokenDefinitions)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedETH = ZERO_BD
    token0.volume = ZERO_BD
    token0.volumeUSD = ZERO_BD
    token0.feesUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalValueLocked = ZERO_BD
    token0.totalValueLockedUSD = ZERO_BD
    token0.totalValueLockedUSDUntracked = ZERO_BD
    token0.txCount = ZERO_BI
    token0.poolCount = ZERO_BI
    token0.whitelistPools = []
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)
    const decimals = fetchTokenDecimals(event.params.token1)
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.decimals = decimals
    token1.derivedETH = ZERO_BD
    token1.volume = ZERO_BD
    token1.volumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.feesUSD = ZERO_BD
    token1.totalValueLocked = ZERO_BD
    token1.totalValueLockedUSD = ZERO_BD
    token1.totalValueLockedUSDUntracked = ZERO_BD
    token1.txCount = ZERO_BI
    token1.poolCount = ZERO_BI
    token1.whitelistPools = []
  }

  // update white listed pools
  if (whitelistTokens.includes(token0.id)) {
    const newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }
  if (whitelistTokens.includes(token1.id)) {
    const newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.liquidityProviderCount = ZERO_BI
  pool.txCount = ZERO_BI
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.observationIndex = ZERO_BI
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.totalValueLockedETH = ZERO_BD
  pool.totalValueLockedUSDUntracked = ZERO_BD
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.untrackedVolumeUSD = ZERO_BD

  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
  factory.save()
}
