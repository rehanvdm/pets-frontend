import * as cdk from 'aws-cdk-lib';
import Frontend from "./stacks/frontend";

const app = new cdk.App();
async function Main()
{
  cdk.Tags.of(app).add("blog", "pets-frontend");

  let env = {
    region: app.node.tryGetContext("region"),
    account: app.node.tryGetContext("account")
  };
  console.log("CDK ENV", env);

  const frontend = new Frontend( app, "pets-frontend", { env, });

  app.synth();
}

Main().catch(err => {
  console.error(err);
  process.exit(1);
})

