const RefinableERC1155WhiteListedToken = artifacts.require("RefinableERC1155WhiteListedToken");
const { soliditySha3, BN } = require("web3-utils");
const { account_private_keys } = require("../keys.json");

contract("RefinableERC1155WhiteListedToken", accounts => {
    var contract;

    beforeEach(function () {
        return RefinableERC1155WhiteListedToken.new(
            "UniZar2",
            "UNIZ2",
            accounts[1], // signer
            "https://api-testnet.unizar.com/contractMetadata/{address}", // contractURI
            "UNI_", // tokenURIPrefix
            "Uni_", // uri
            { from: accounts[0] }
        )
            .then(function (instance) {
                contract = instance;
            });
    });

    describe("is created correctly", () => {
        it("name and symbol are set correctly", async () => {
            const name = await contract.name();
            const symbol = await contract.symbol();
            assert.equal(name, 'UniZar2');
            assert.equal(symbol, 'UNIZ2');
        });
    });

    describe("mint", () => {
        it("works for the signer of the contract", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})

            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
        });

        it("fails when trying to mint 0 amount", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 0;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})


            let thrownError;
            try {
                await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert Supply should be positive',
            )
        });

        it("Also works if the creator signs", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );
            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[0]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})
            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
        });

        it("does not work without having the private key", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612";
            const contractAddressTokenIdSha = soliditySha3(
                contractAddress,
                tokenId
            );
            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, '94386a200a6c8c4a8FAKE_KEY0aed144a6e046e9e331e17b8ba583ac07c16918'); // FAKE_KEY
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})
            let thrownError;
            try {
                await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert invalid signature',
            )
        });

        it("does not work if delete signer", async () => {
            await contract.removeSigner(accounts[1], { from: accounts[0] });

            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})

            try {
                await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert invalid signature',
            )
        });

        it("work if add a signer", async () => {
            await contract.addSigner(accounts[2], { from: accounts[0] });

            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[2]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})
            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
        });
    });

    describe("mint with mutiple supply", () => {
        it("works for the signer of the contract", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 100;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})

            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            const amount = new BN(await contract.balanceOf(accounts[2], tokenId, { from: accounts[2] })).toNumber();
            assert.equal(amount, 100);
        });

        it("Also works if the creator signs", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );
            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[0]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 100;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})
            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            const amount = new BN(await contract.balanceOf(accounts[2], tokenId, { from: accounts[2] })).toNumber();
            assert.equal(amount, 100);
        });

        it("does not work without having the private key", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612";
            const contractAddressTokenIdSha = soliditySha3(
                contractAddress,
                tokenId
            );
            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, '94386a200a6c8c4a8FAKE_KEY0aed144a6e046e9e331e17b8ba583ac07c16918'); // FAKE_KEY
            const fees = [];
            const supply = 100;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})
            let thrownError;
            try {
                await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert invalid signature',
            )
        });

        it("does not work if delete signer", async () => {
            await contract.removeSigner(accounts[1], { from: accounts[0] });

            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 100;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})
            try {
                await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert invalid signature',
            )
        });

        it("work if add a signer", async () => {
            await contract.addSigner(accounts[2], { from: accounts[0] });

            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[2]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 100;
            const tokenURI = "fakeTokenURI";

            await contract.addMinter(accounts[2], {from: accounts[0]})

            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
            const amount = new BN(await contract.balanceOf(accounts[2], tokenId, { from: accounts[2] })).toNumber();
            assert.equal(amount, 100);
        });
    });

    describe("signer", () => {
        it("doesn't works for remove signer with random account", async () => {
            let thrownError;
            try {
                await contract.removeSigner(accounts[1], { from: accounts[5] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'evert Ownable: caller is not the owner',
            )
        });
        it("works for remove signer with admin account", async () => {
            await contract.removeSigner(accounts[1], { from: accounts[0] });
        });
        it("doesn't works for add signer with random account", async () => {
            let thrownError;
            try {
                await contract.addSigner(accounts[1], { from: accounts[5] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'evert Ownable: caller is not the owner',
            )
        });
        it("works for add signer with admin account", async () => {
            await contract.addSigner(accounts[2], { from: accounts[0] });
        });
    });
    describe("white list", () => {
        it("does not work from a user who is not a minter", async () => {
            const contractAddress = contract.address;
            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            try {
                await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[3] });
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert Ownable: caller is not the minter',
            )
        });
        it("does not work if random user try to add minter", async () => {
            const contractAddress = contract.address;

            try {
                await contract.addMinter(accounts[2], { from: accounts[1] })
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert Ownable: caller is not the admin',
            );
        });
        it("does not work if random user try to add admin", async () => {
            const contractAddress = contract.address;

            try {
                await contract.addAdmin(accounts[2], { from: accounts[1] })
            } catch (error) {
                thrownError = error;
            }
            assert.include(
                thrownError.message,
                'revert Ownable: caller is not the admin',
            );
        });
        it("work if admin add a new admin and new admin add a new minter.", async () => {
            const contractAddress = contract.address;

            await contract.addAdmin(accounts[3], { from: accounts[0] })
            await contract.addMinter(accounts[2], { from: accounts[3] })

            const tokenId = "0x0f961e819bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
            const contractAddressTokenIdSha = soliditySha3( // Equal to keccak256(abi.encodePacked(address(this), tokenId));
                contractAddress,
                tokenId
            );

            const sig = web3.eth.accounts.sign(contractAddressTokenIdSha, account_private_keys[1]); // Can be recovered with web3.eth.accounts.recover(sig)
            const fees = [];
            const supply = 1;
            const tokenURI = "fakeTokenURI";

            await contract.mint(tokenId, sig.signature, fees, supply, tokenURI, { from: accounts[2] });
        });
    });
});
