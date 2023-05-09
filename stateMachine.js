const fs = require('fs')
const solc = require('solc')
const git = require('simple-git')()

const contractPath = './Example.sol'
const statePath = './data/state.json'
const ledgerPath = './data/ledger.json'

// Compile the Solidity contract
const compileContract = () => {
  const input = fs.readFileSync(contractPath, 'utf8')
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity',
    sources: {
      'Example.sol': {
        content: input
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  })))

  return output.contracts['Example.sol'].Example
}

// Load the state and ledger
const loadStateAndLedger = () => {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))

  return { state, ledger }
}

// Save the state and ledger
const saveStateAndLedger = (state, ledger) => {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2))
}

// Execute a function from the smart contract
const executeFunction = (functionName, ...args) => {
  const { abi, evm } = compileContract()
  const { state, ledger } = loadStateAndLedger()

  // Find the function to execute
  const func = abi.find((entry) => entry.name === functionName)

  if (!func) {
    throw new Error(`Function "${functionName}" not found in the smart contract`)
  }

  // Execute the function
  const { newValue } = args
  state.value = newValue

  // Update the ledger with the transaction
  const transaction = { functionName, args, timestamp: new Date().toISOString() }
  ledger.push(transaction)

  // Save the updated state and ledger
  saveStateAndLedger(state, ledger)

  // Commit the changes to the Git repository
  // git.add([statePath, ledgerPath]).commit('Update state and ledger')
}

// Example usage
let params = process.argv[2] || 21
executeFunction('setValue', 42)
