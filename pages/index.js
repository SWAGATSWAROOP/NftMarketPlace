import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
// To connect to a wallet we use web3Modal
import Web3Modal from "web3modal";
import { nftaddress, nftmarketaddress } from "../config.js";

// Importing ABI
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs() {
    // As we want to fetch data from blockchain which is not on a single server
    // Multiple Server are there therefore We use RPC :-> Remote Procedure Call
    // which give response in json
    const provider = new ethers.providers.JsonRpcProvider();

    // Using this we can access all the functions that the NFT have
    const nftContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const nftMarketContract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      provider
    );

    // For Fetching the NFTS
    const data = await nftMarketContract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await nftContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);

        // Convert the wei value into ethers
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");

        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };

        return item;
      })
    );
    setNfts(items);
    setLoadingState("loaded");
  }

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    // Connecting to the wallet
    const connection = await web3Modal.connect();
    // Using this we can facilitate buying of the NFTs
    const provider = new ethers.providers.Web3Provider(connection);
    // Make the person sign the transaction
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );
    const price = ethers.utils.parseUnits(contract.price.toString(), "ether");
    const transaction = await contract.createMarketSale(
      nftmarketaddress,
      nft.tokenId,
      {
        value: price,
      }
    );
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState === "loaded" && !nftmarketaddress.length) {
    return (
      <div>
        <p className="px-10 py-10 text-2xl font-bold flex justify-center text-cyan-100">
          There Are Currently No NFT in marketplace
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {nfts.map((nft, i) => {
            <div key={i} className="border shadow rounded-3xl overflow-hidden">
              <img src={nft.image} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} ETH
                </p>
                <button
                  className="w-full bg-purple-600 text-white font-bold py-2 px-12 rounded"
                  onClick={() => buyNFT(nft)}
                ></button>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
