import Sandbox from "@e2b/code-interpreter";

export const getSandbox = async (sbxId: string) => {
  return await Sandbox.connect(sbxId);
};
