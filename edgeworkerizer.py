import sys
import re
from base64 import b64decode
import hashlib

# This regex is written to match against the wasm dynamically loaded by Deno's hash library
regex = r'const data = decode.?\("(.*?)".*?\);'

def repl(m):
    b64_wasm = m.group(1).replace('\n', '').replace('\\', '')
    wasm = b64decode(b64_wasm)

    # Write the module to a file
    with open('build/deno-crypto.wasm', "wb") as f:
        f.write(wasm)

    replace = f'import wasmModule from \'./deno-crypto.wasm\';'

    return replace

def main(argv):
    if len(argv) != 1:
        print("Specify input file")
        exit(1)

    with open(argv[0]) as f:
        program = f.read()
        program = re.sub(regex, repl, program, flags=re.DOTALL)
        program = re.sub('const wasmModule = new WebAssembly.Module\(data\);', '', program)
        program = re.sub('_wasmBytes: data', '', program)
        print(program)

if __name__ == "__main__":
    main(sys.argv[1:])
