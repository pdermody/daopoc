import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

const FILE = "proposals.json"

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, chainId } = req.body;

  const proposals = JSON.parse(fs.readFileSync(FILE, "utf8"))

  if (!proposals || !proposals[chainId]) {
    if (!proposals)
      proposlas = {}
    proposlas[chainId] = []
  }
  proposals[chainId!.toString()].push(req.body)
  fs.writeFileSync(FILE, JSON.stringify(proposals))

  res.send(id);
}
