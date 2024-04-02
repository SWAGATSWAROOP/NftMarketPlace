import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
// To connect to a wallet we use web3Modal
import Web3Modal from "web3modal";
import { nftaddress, nftmarketaddress } from "../config.js";

// Importing ABI
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";


