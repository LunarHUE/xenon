# Dev shells. `default` is what the repo pod loads for every routed command,
# ssh session and editor terminal; `ci` is the toolchain alone, for workflow
# steps that need it (`nix develop .#ci`). `default` also carries the agent
# CLIs from nix/harness.nix.
#
# Nothing in a shellHook may write to stdout: the repo pod sources this
# environment before every routed command, so a banner would land in that
# command's output.
{ pkgs, harnessPackages }:
let
  # Everything needed to install, build, and test.
  corePackages = with pkgs; [
    bun
  ];

  # Playwright checks apt-installed browser libraries with ldd from PATH.
  # Nix's ldd can report those host libraries as missing on Debian/Ubuntu.
  hostLdd = pkgs.writeShellScriptBin "ldd" ''
    exec /usr/bin/ldd "$@"
  '';

  shellHook = pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
    if [ -x /usr/bin/ldd ]; then
      export PATH="${hostLdd}/bin:$PATH"
    fi
  '';
in
{
  default = pkgs.mkShell {
    packages = corePackages ++ harnessPackages ++ (with pkgs; [
      bashInteractive
      nodejs_24
      ripgrep
    ]);
    inherit shellHook;
  };

  ci = pkgs.mkShell {
    packages = corePackages;
    inherit shellHook;
  };
}
