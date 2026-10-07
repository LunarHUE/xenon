{ lib, hostPlatform, lockfile }:
let
  # Bun's text lockfile allows trailing commas. Keep the original lockfile for
  # installation; only read its platform metadata to trim the Nix cache.
  # Match commas before a real newline so quoted JSON strings stay intact.
  json = builtins.concatStringsSep "" (
    map (part: if builtins.isList part then builtins.head part else part)
      (builtins.split ",([ \t\r]*\n[[:space:]]*(}|]))" (builtins.readFile lockfile))
  );
  lock = builtins.fromJSON json;
  metadata = builtins.listToAttrs (
    map (entry: {
      name = builtins.head entry;
      value = builtins.elemAt entry 2;
    }) (builtins.attrValues lock.packages)
  );
  os = if hostPlatform.isDarwin then "darwin" else hostPlatform.parsed.kernel.name;
  cpu = {
    x86_64 = "x64";
    aarch64 = "arm64";
    i686 = "ia32";
  }.${hostPlatform.parsed.cpu.name} or hostPlatform.parsed.cpu.name;
  matches = current: constraint:
    let
      values = if builtins.isList constraint then constraint else lib.splitString "," constraint;
      positive = builtins.filter (value: !lib.hasPrefix "!" value) values;
    in
    !(builtins.elem "!${current}" values)
    && (positive == [] || builtins.elem current positive || builtins.elem "any" positive);
in
packages:
lib.filterAttrs (name: _:
  let entry = metadata.${name} or {};
  in matches os (entry.os or []) && matches cpu (entry.cpu or [])
) packages
