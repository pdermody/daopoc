import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

const FILE = "proposals.json"

const getProposals = async (req: NextApiRequest, res: NextApiResponse) => {
  const { cid } = req.query as { cid: string };

  const proposals = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {}

  if (proposals[cid])
    res.send(proposals[cid]);
  else 
    res.send([])
}

export default getProposals