{
  description = "xenon";

  # Inputs and wiring only. The shells live under nix/:
  #   nix/devshells.nix  dev shells (the repo pod loads `default`)
  #   nix/harness.nix    agent CLIs in the default dev shell

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    # Agent CLIs for the default dev shell (nix/harness.nix).
    claude-code = {
      url = "github:sadjow/claude-code-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    codex-cli-nix = {
      url = "github:sadjow/codex-cli-nix";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = inputs@{ nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        harness = import ./nix/harness.nix {
          inherit pkgs;
          inherit (inputs) claude-code codex-cli-nix;
        };
      in {
        devShells = import ./nix/devshells.nix {
          inherit pkgs;
          harnessPackages = harness.packages;
        };
      });
}
