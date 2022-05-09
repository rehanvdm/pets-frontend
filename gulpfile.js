const gulp = require('gulp');
const fs = require('fs');
const os = require('os');
const path  = require('path');
const spawn = require('child_process').spawn;

function preferLocalPackages(npmBinPath)
{
  if(process.platform === "win32")
    process.env.PATH = process.env.PATH + npmBinPath + ";";
  else
    process.env.PATH = process.env.PATH + ":" + npmBinPath;
}

const paths = {
  localPackages: path.resolve(__dirname + "/node_modules/.bin"),

  workingDir: path.resolve(__dirname),

  src: path.resolve(__dirname + "/src"),
  dist: path.resolve(__dirname + "/dist"),
};
preferLocalPackages(paths.localPackages);
const config = {
  profileName: "<YOUR AWS PROFILE NAME TO USE FOR DEPLOYMENTS>",
  region: "<AWS REGION TO DEPLOY IN>",
  account: "<AWS ACCOUNT ID TO DEPLOY IN>",
};


/**
 * Runs a command, returns the stdout on a successful exit code(0)
 * @param command The executable name
 * @param args The args as a string
 * @param cwd Current Working Directory
 * @param echo Pipes the command standard streams directly to this process to get the output as it is happening,
 *             not waiting for the exit code. Also shows the command that was run
 * @param prefixOutputs Useful if running multiple commands in parallel
 * @param extraEnv Extra variables to pass as Environment variables
 * @return {Promise<string>}
 */
async function execCommand(command, args, cwd = __dirname, echo = true, prefixOutputs = "", extraEnv = {})
{
  return new Promise((resolve, reject) =>
  {
    let allData = "";
    let errOutput = "";
    if(echo)
      console.log(">", command, args);

    const call = spawn(command, [args], {shell: true, windowsVerbatimArguments: true, cwd: cwd, env: {...process.env, ...extraEnv} });

    call.stdout.on('data', function (data)
    {
      allData += data.toString();
      echo && process.stdout.write(prefixOutputs + data.toString());
    });
    call.stderr.on('data', function (data)
    {
      errOutput += data.toString();
      echo && process.stdout.write(prefixOutputs + data.toString());
    });
    call.on('exit', function (code)
    {
      if (code == 0)
        resolve(allData);
      else
        reject({command, args, stdout: allData, stderr: errOutput});
    });
  });
}

function clearDir(destDir)
{
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, {recursive: true});
}


async function buildFrontend(clearDist = true)
{
  if(clearDist)
    clearDir(paths.dist);

  await execCommand("browserify", "index.ts -p [ tsify --noImplicitAny ] --project tsconfig.json > index.js", paths.src);
  fs.copyFileSync(paths.src+"/index.html", paths.dist+"/index.html");
  fs.copyFileSync(paths.src+"/index.js", paths.dist+"/index.js");
}
gulp.task('build_source', async () =>
{
  await buildFrontend();
});
gulp.task('watch_source', async () =>
{
  await buildFrontend(false);
  gulp.watch(['src/index.html', 'src/index.ts'], async function(cb)
  {
    await buildFrontend(false);
    cb();
  });
});


async function cdkCommand(command)
{
  let extraArgs = "";

  if(command.startsWith("deploy"))
    extraArgs = "--require-approval=never";

  let args = [
    command,
    "\"*\"",
    "--profile " + config.profileName,
    "-c region=" + config.region,
    "-c account=" + config.account,
    extraArgs
  ].join(" ");

  await execCommand("cdk", args, paths.workingDir);
}
gulp.task('cdk_bootstrap', async () =>
{
  try
  {
    await execCommand("tsc", "", paths.workingDir);
    await execCommand("cdk", "bootstrap --profile " + config.profileName + " " + config.account + "/" + config.region, paths.workingDir);
  }
  catch (e) {
    console.error(e);
    throw e;
  }
});
gulp.task('cdk_diff', async () =>
{
  try
  {
    await buildFrontend();
    await execCommand("tsc", "", paths.workingDir);
    await cdkCommand("diff");
  }
  catch (e) {
    console.error(e);
    throw e;
  }
});
gulp.task('cdk_hotswap', async () =>
{
  try
  {
    await buildFrontend();
    await execCommand("tsc", "", paths.workingDir);
    await cdkCommand("deploy --hotswap");
  }
  catch (e) {
    console.error(e);
    throw e;
  }
});
gulp.task('cdk_deploy', async () =>
{
  try
  {
    await buildFrontend();
    await execCommand("tsc", "", paths.workingDir);
    await cdkCommand("deploy");
  }
  catch (e) {
    console.error(e);
    throw e;
  }
});
