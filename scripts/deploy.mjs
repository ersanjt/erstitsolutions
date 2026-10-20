// Uploads dist/ to the cPanel host over SFTP. The server .htaccess keeps the blocks cPanel
// generates (PHP handler, ini directives); they are fetched first and appended to ours.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, relative } from "node:path";

const { SFTP_HOST, SFTP_USER } = process.env;
const KEY = process.env.SFTP_KEY_PATH || join(homedir(), ".ssh", "erstitsolutions_deploy");
const REMOTE = "public_html";
const DIST = "dist";

if (!SFTP_HOST || !SFTP_USER) throw new Error("Set SFTP_HOST and SFTP_USER (locally in .env.deploy).");
if (!existsSync(join(DIST, "index.html"))) throw new Error("dist/ is missing; run npm run build first.");

const slash = (p) => p.replaceAll("\\", "/");
const quote = (p) => `"${slash(p)}"`;
const work = mkdtempSync(join(tmpdir(), "erst-deploy-"));

function sftp(lines) {
  const batch = join(work, "batch.txt");
  writeFileSync(batch, `${lines.join("\n")}\n`);
  const res = spawnSync(
    "sftp",
    ["-i", KEY, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-b", batch, `${SFTP_USER}@${SFTP_HOST}`],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    process.stderr.write(res.stdout + res.stderr);
    throw new Error(`sftp exited with ${res.status}`);
  }
}

try {
  const stage = join(work, "site");
  cpSync(DIST, stage, { recursive: true });

  const serverCopy = join(work, "htaccess.server");
  sftp([`get ${quote(`${REMOTE}/.htaccess`)} ${quote(serverCopy)}`]);
  const blocks = readFileSync(serverCopy, "utf8").match(
    /^# (?:php -- )?BEGIN cPanel-generated[\s\S]*?^# (?:php -- )?END cPanel-generated.*$/gm,
  );
  if (!blocks) throw new Error("No cPanel blocks in the server .htaccess; refusing to overwrite the PHP handler.");
  const ours = readFileSync(join(stage, ".htaccess"), "utf8").trimEnd();
  writeFileSync(join(stage, ".htaccess"), `${ours}\n\n${blocks.join("\n\n")}\n`);

  const dirs = [];
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        dirs.push(slash(relative(stage, p)));
        walk(p);
      } else files.push(slash(relative(stage, p)));
    }
  };
  walk(stage);

  const top = readdirSync(stage).sort();
  const topDirs = top.filter((n) => statSync(join(stage, n)).isDirectory());
  // Hashed assets first so new HTML never points at files that are not there yet; .htaccess last.
  topDirs.sort((a, b) => (a === "assets" ? -1 : b === "assets" ? 1 : 0));
  const topFiles = top.filter((n) => !topDirs.includes(n) && n !== ".htaccess");

  sftp([
    `lcd ${quote(stage)}`,
    `cd ${REMOTE}`,
    ...topDirs.map((d) => `put -r ${d}`),
    ...topFiles.map((f) => `put ${f}`),
    "put .htaccess",
    ...dirs.map((d) => `chmod 755 ${d}`),
    ...files.map((f) => `chmod 644 ${f}`),
  ]);
  console.log(`Deployed ${files.length} files to ${REMOTE}.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
