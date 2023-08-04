### How to use

## /claim

Claim roles by verifying that you are the owner of the given root account of your Joystream membership
`wallet`: The root account of your Joystream membership

example: /claim wallet j4Umbxo2oPWGH6o311bMVTZ69WuoyfSdGPjQxT32fwvaeAfGb

After running this command you will see a message similar to the following:
“Go to this URL https://polkadot.js.org/apps/?rpc=wss://rpc.joystream.org:9944#/signing and sign the following data with the given account. diKpFEHLOs”

In this case, you must continue verification by following the URL and signing the random string at the end of the message with the given root account.
Then you must continue by running the command /solve

## /solve

Finish linking of discord account to Joystream membership by supplying the resulting signature from the above step.
`signature`: the resulting signature after signing the random string from /claim

example: /solve signature 0xa02c83a75d38674e5b9dfc25678afd726be8a43fff254c15c24357936040a3233368b40a9fb17b80e1a606101b3e3b92ca1705a76432ee856a28102813d3268b
After running this command, if everything is well, the following message will be displayed.
”Your on-chain roles will added within a few minutes.”

## /who_is

List member id and on-chain roles of the given discord account
`discord_handle`: the discord Usename of which you wish to display information 

example: /who_is accxyz

## /list_role_members

List the  discord usernames who have the specified discord role
`discord_role`: The command will display users with this role

example: /discord_role “Founding Member”

## /status

Displays the following information
- on-chain roles that are empty
- what version of bot is running.
- last block where synchronization happened (assuming its poll based as above), current

## /help

Link the user to this help page.

### Setup
In order to start the discord bot server and connect it to the Joystream discord server, the admin must follow the next steps.
- Setup a mongodb server
- Configure the env file.
MONGO_URI = mongo uri
SERVER_TOKEN = discord server token
VERSION= version number
QUERY_NODE= URL of Joystream QN
RPC_URL= URL of Joystream RPC
SYNCH_TIME = time of synchronization in minutes
- Start the server