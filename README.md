#TODO

###Dashboard
  * Show recent mints.
  * Show upcoming mints.
  * Quick Add upcoming hyped mints.
###Wallets
  * Allow for even distribution of funds.
  * Add better error messages for wallets.
  * Rename wallets
###OpenSea
  * OpenSea bidder
  * OpenSea quick task
  * Better UI for the tasks
  * Look into @opensea for custom gas
  * Look into opensea-js to see if we can intercept the data being sent so that we can instead send our own transaction.
  * Option to lower floor price automatically.
  * Option to auto list sniped listing.
###Mint Bot
  * There is a bug when delete a tasks in a group or when delete a group with some tasks.
###Profit Tracker
  * Get Successes from OpenSea
    * Need to add total profit/loss to the object.
  * Get mints from OpenSea
    * Compare from_address to see if NullAddress
    * Keep track of transactions hash and compare to the etherscan page.
      * Need to parse response from etherscan tx page using DOMParser
      * https://stackoverflow.com/questions/10585029/parse-an-html-string-with-js
    * Compare transfer data with parsed data
###New Stuff
  * Gas calculator
  * Fix refresh requiring auth
  * Work on UI for different screen sizes
  * x2y2 sniper
  * Mass listing of NFT's in wallet