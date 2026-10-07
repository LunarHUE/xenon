{
  description = "xenon";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    claude-code = {
      url = "github:sadjow/claude-code-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    codex-cli-nix = {
      url = "github:sadjow/codex-cli-nix";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };

    # Private repo. HTTPS lets git's credential helper supply access.
    headless-paper = {
      url = "git+https://github.com/LunarHUE/headless-paper.git?ref=main";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };

    t3code = {
      url = "github:LunarHUE/t3code";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    codex-cli-nix,
    claude-code,
    headless-paper,
    t3code,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;

          config.allowUnfree = true;

          overlays = [
            claude-code.overlays.default
            codex-cli-nix.overlays.default
            headless-paper.overlays.default
            # The pinned bun2nix caches every platform. Filter headless-paper's
            # cache with its original lock metadata before creating derivations.
            (final: prev: {
              headless-paper = prev.headless-paper.override {
                bun2nix = let
                  upstream = headless-paper.inputs.bun2nix.packages.${system}.default;
                  filterPlatform = import ./nix/filter-bun-platform.nix {
                    inherit (final) lib;
                    inherit (final.stdenv) hostPlatform;
                    lockfile = headless-paper.outPath + "/bun.lock";
                  };
                in upstream // {
                  fetchBunDeps = args: upstream.fetchBunDeps (args // {
                    bunNix = final.lib.setFunctionArgs
                      (packageArgs: filterPlatform (import args.bunNix packageArgs))
                      (builtins.functionArgs (import args.bunNix));
                  });
                };
              };
            })
          ];
        };

        # Everything needed to install, build, and test. Both shells get these.
        corePackages = with pkgs; [
          bun
        ];

        # Playwright checks apt-installed browser libraries with ldd from PATH.
        # Nix's ldd can report those host libraries as missing on Debian/Ubuntu.
        hostLdd = pkgs.writeShellScriptBin "ldd" ''
          exec /usr/bin/ldd "$@"
        '';

        coreShellHook = pkgs.lib.optionalString pkgs.stdenv.isLinux ''
          if [ -x /usr/bin/ldd ]; then
            export PATH="${hostLdd}/bin:$PATH"
          fi
        '';

        # Interactive-only tooling. Kept out of ci so the CI closure stays small.
        devOnlyPackages = with pkgs; [
          bashInteractive
          bash-completion
          nix-bash-completions

          git
          gh
          ripgrep

          nodejs_24

          pkgs.claude-code
          pkgs.codex
          pkgs.headless-paper
        ] ++ pkgs.lib.optionals (t3code.packages ? ${system}) [
          t3code.packages.${system}.t3
          t3code.packages.${system}.t3-devcontainer
        ];

        devShell = pkgs.mkShell {
          packages = corePackages ++ devOnlyPackages;

          BASH_COMPLETION_PATH =
            "${pkgs.bash-completion}/etc/profile.d/bash_completion.sh";

          shellHook = coreShellHook + ''
            echo "Nix devShell ready. bun $(bun --version 2>/dev/null)"
          '';
        };
      in {
        devShells = {
          default = devShell;
          dev = devShell;

          ci = pkgs.mkShell {
            packages = corePackages;
            shellHook = coreShellHook;
          };
        };
      });
}
