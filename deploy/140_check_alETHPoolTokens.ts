import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isTestNetwork } from "../utils/network"
import { BigNumber } from "ethers"

const ALETH_TOKENS_ARGS: { [token: string]: any[] } = {
  ALETH: ["Alchemix ETH", "alETH", "18"],
  SETH: ["Synthetic ETH", "sETH", "18"],
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { deploy, execute, getOrNull } = deployments
  const { deployer } = await getNamedAccounts()

  if ((await getOrNull("WETH")) == null) {
    await deploy("WETH", {
      from: deployer,
      contract: "WETH9",
      log: true,
      skipIfAlreadyDeployed: true,
    })

    if (isTestNetwork(await getChainId())) {
      await execute(
        "WETH",
        {
          from: deployer,
          log: true,
          value: BigNumber.from(10).pow(18).mul(1000),
        },
        "deposit",
      )
    }
  }

  for (const token in ALETH_TOKENS_ARGS) {
    await deploy(token, {
      from: deployer,
      log: true,
      contract: "GenericERC20",
      args: ALETH_TOKENS_ARGS[token],
      skipIfAlreadyDeployed: true,
    })
    // If it's on hardhat, mint test tokens
    if (isTestNetwork(await getChainId())) {
      const decimals = ALETH_TOKENS_ARGS[token][2]
      await execute(
        token,
        { from: deployer, log: true },
        "mint",
        deployer,
        BigNumber.from(10).pow(decimals).mul(1000),
      )
    }
  }
}
export default func
func.tags = ["ALETHPoolTokens"]