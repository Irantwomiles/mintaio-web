# Deployment notes
Make sure source maps are not showing. If the source maps are showing, delete the dist file then run the build command again (I know the build command already removes the dist file, just do it again). It has something to do with caching.


#TODO

###Dashboard
  * Show recent mints.
  * Show upcoming mints.
  * Quick Add upcoming hyped mints.
###Wallets
  * Allow for even distribution of funds.
  * Rename wallets
###OpenSea
  * OpenSea bidder
  * OpenSea quick task
  * Option to auto list sniped listing.
###Mint Bot
  * There is a bug when delete a tasks in a group or when delete a group with some tasks.
  * Move starting, stopping, and deleting tasks to the state class (like os sniper)
###Profit Tracker
  * Check etherscan for failed transactions so that we can add the gas of those as well to the total gas spent.
  * Add x2y2 support
  * Show daily profit by contract address
###New Dashboard
  * Instead of a spam of live mints, just show what's minting per contract
###New Stuff
  * Gas calculator
  * Fix refresh requiring auth
  * Work on UI for different screen sizes
  * x2y2 sniper
  * Mass listing of NFT's in wallet
###Sidebar
  * Discord section
    * user image: https://cdn.discordapp.com/avatars/200435096770183169/c9516f5d1bbfb462ddc8b03c58937bb9
  * Move Sidebar out of each component and into only App. We can keep track of what page we are on using an onclick.
###Aptos
  * https://explorer.aptoslabs.com/
  * https://www.topaz.so/