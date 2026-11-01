# Source this file before using Ginny/PowerShell in the Linux cloud environment.
ginny_tools_root="${GINNY_TOOLS_DIR:-/workspace/ginny-tools}"
export PATH="$ginny_tools_root/powershell-7.6.8:$PATH"
export XDG_CACHE_HOME="$ginny_tools_root/cache"
export XDG_CONFIG_HOME="$ginny_tools_root/config"
export XDG_DATA_HOME="$ginny_tools_root/data"
mkdir -p "$XDG_CACHE_HOME" "$XDG_CONFIG_HOME" "$XDG_DATA_HOME"
