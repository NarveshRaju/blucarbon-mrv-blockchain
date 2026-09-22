const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');

function compileContract() {
  const input = {
    language: 'Solidity',
    sources: { 'BlueCarbonToken.sol': { content: fs.readFileSync(path.join(__dirname, '../contracts/BlueCarbonToken.sol'), 'utf8') } },
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai',
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), {
    import: source => {
      if (!source.startsWith('@openzeppelin/contracts/') || source.includes('..')) return { error: 'Unsupported import' };
      try { return { contents: fs.readFileSync(require.resolve(source), 'utf8') }; }
      catch { return { error: `Cannot resolve ${source}` }; }
    }
  }));
  const errors = (output.errors || []).filter(item => item.severity === 'error');
  if (errors.length) throw new Error(errors.map(item => item.formattedMessage).join('\n'));
  const result = output.contracts['BlueCarbonToken.sol'].BlueCarbonToken;
  return { abi: result.abi, bytecode: '0x' + result.evm.bytecode.object, compiler: solc.version() };
}
if (require.main === module) {
  const artifact = compileContract();
  console.log(`Compiled BlueCarbonToken with ${artifact.compiler}; ${artifact.bytecode.length / 2 - 1} bytes.`);
}
module.exports = { compileContract };
