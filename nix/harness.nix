# Agent CLIs in devShells.default, for workspaces that do not run the LunarHUE
# parent pod. The `ci` shell leaves them out.
#
# The overlays go on a separate package set so the `pkgs` the shells build from
# stays exactly nixpkgs.
{ pkgs, claude-code, codex-cli-nix }:
let
  agentPkgs = pkgs.appendOverlays [
    claude-code.overlays.default
    codex-cli-nix.overlays.default
  ];
in
{
  packages = [
    agentPkgs.claude-code
    agentPkgs.codex
    pkgs.gh
    pkgs.bash-completion
    pkgs.nix-bash-completions
  ];
}
