import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

const FILE = "proposals.json"

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { cid } = req.query as { cid: string };

  const proposals = JSON.parse(fs.readFileSync(FILE, "utf8"))

  if (proposals[cid])
    res.send(proposals[cid]);
  else 
    res.send([])
}
