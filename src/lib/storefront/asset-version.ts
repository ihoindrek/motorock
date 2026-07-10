import packageJson from "../../../package.json";

export function getAssetVersion() {
  return (
    process.env.NEXT_PUBLIC_ASSET_VERSION?.trim() ||
    packageJson.version ||
    "1"
  );
}
