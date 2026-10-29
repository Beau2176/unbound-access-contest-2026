"""Export source without repository identity, secrets, dependencies or generated archives."""
from pathlib import Path
import subprocess,zipfile,json,re
root=Path(__file__).resolve().parent.parent
files=subprocess.run(['git','ls-files','-co','--exclude-standard'],cwd=root,check=True,capture_output=True,text=True).stdout.splitlines()
out=root/'public/artifacts/unbound-access-source.zip';out.parent.mkdir(parents=True,exist_ok=True)
excluded=('node_modules/','.git/','dist/','.wrangler/','.sites-runtime/','demo/work/','public/artifacts/','outputs/','work/')
manifest=[]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name in sorted(set(files)):
  p=root/name
  if not p.is_file() or (name.startswith(excluded) and name!='public/artifacts/LLAMA-3.2-LICENSE.txt') or (p.name.startswith('.env') and p.name!='.env.example'):continue
  data=p.read_bytes()
  if re.search(rb'(?:sk-[A-Za-z0-9_-]{20,}|nvapi-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,})',data):raise ValueError('Credential-like content in '+name)
  if name=='.openai/hosting.json':
   config=json.loads(data);config.pop('project_id',None);data=(json.dumps(config,indent=2)+'\n').encode()
  z.writestr('unbound-access/'+name,data);manifest.append(name)
 z.writestr('unbound-access/PUBLIC_SOURCE_EXPORT.md','Complete contest source export. Site project identity, Git metadata, secrets, dependencies, build intermediates and generated downloads are excluded. The demo is reproducible with demo/render.py. See README.md for setup and docs/SUBMISSION_DRAFT.md for honest current status.\n')
print(json.dumps({'archive':str(out),'files':len(manifest)+1,'bytes':out.stat().st_size,'credential_scan':'passed'}))
