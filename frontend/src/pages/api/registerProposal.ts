import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

const FILE = "proposals.json"

const registerProposal = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, chainId } = req.body;

  let proposals = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {}

  if (!proposals[chainId])
    proposals[chainId] = []

  proposals[chainId!.toString()].push(req.body)
  fs.writeFileSync(FILE, JSON.stringify(proposals))

  res.send(id);
}

export default registerProposal