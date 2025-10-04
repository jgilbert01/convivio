# @Convivio

[@Convivio](https://github.com/jgilbert01/convivio) is a drop in replacement for the Serverless Framework (SF) v3. It is not a fork. It is a separate project that conforms to the v3 YAML and generates the same CloudFormation templates.

It supports these essentials:
* NodeJS
* AWS CloudFormation
* Webpack
* The patterns from my [books](https://www.amazon.com/stores/John-Gilbert/author/B07BDR3P6P) (so far)

## The @Convivio Story

Why did we create @Convivio?

We support 100s of production stacks for many customers.
Many of our customers do not want to upgrade to SF v4.
Switching to another tool is a large, tricky and costly effort that is full of risks to production systems, such as downtime and data lose.

We needed a solution that would generate the same CloudFormation templates, so that these production systems would not know or care that a new tool was in control.

We were already creating a new Serverless plugin to replace the Offline plugin, because it no longer supported our [VCR-based integration testing](https://medium.com/@jgilbert001/transitive-end-to-end-testing-7ef1cd907a2b) approach. You can find the details [here](https://github.com/jgilbert01/convivio/tree/master/packages/serverless-plugin), [here](https://github.com/jgilbert01/convivio/tree/master/packages/webpack) and [here](https://github.com/jgilbert01/convivio/tree/master/packages/testing). You can start using this plugin with SF to test the waters.

With these BIG pieces in the bag, the idea of building out the rest of what we needed was less daunting.

So we set out to see if we could build a serverless.yml parser, replete with support for Variables, with a reasonable amount of effort. You can find the result [here](https://github.com/jgilbert01/convivio/tree/master/packages/parse).

Along the way we discovered that Webpack has a separate plugin framework called [Tappable](https://www.npmjs.com/package/tapable) that we could leverage to make @Convivio very flexible. We combined this with the [Commander](https://www.npmjs.com/package/commander) CLI framework and we were off to the races.

We had a [CLI](https://github.com/jgilbert01/convivio/tree/master/packages/cli), we created [Connectors](https://github.com/jgilbert01/convivio/tree/master/packages/connectors) to access AWS, and we could [Deploy](https://github.com/jgilbert01/convivio/tree/master/packages/deploy) a template with AWS CloudFormation.

Next, we needed to [Generate](https://github.com/jgilbert01/convivio/tree/master/packages/gen) all the CloudFormation resource templates that we needed for our stacks. This part could be endless, so we have created the generators that we need to support the patterns that we use in all our systems, as documented [here](https://www.amazon.com/stores/John-Gilbert/author/B07BDR3P6P). Thanks to Tapable you can add more generators.

The story isn't over, but we were able to create a practical and flexible solution for our customers. Maybe it can help you as well. See the Contributions section for more on the road map.

## Contributions
The @Convivio journey is lean and iterative.
[Feedback](https://github.com/jgilbert01/convivio/issues) and [Pull Requests](https://github.com/jgilbert01/convivio/pulls) are weclomed.

## Philosophies
* Your IaC tool should not require you to install tools that you do not use in your runtime. In other words, don't force me to install python to deploy my NodeJS based code.
* Declarative IaC is a perfect match for repeatable architectural services patterns. Seed from a service [Template](https://github.com/jgilbert01/convivio/tree/master/templates) to hit the ground running and tweak as needed.
* Opinionated, repeatable arechitectural services patterns are a good thing!!
* Security by Design starts with your IaC tool!!


## Documentation and References

* [CLI](https://github.com/jgilbert01/convivio/tree/master/packages/cli)
* [Connectors](https://github.com/jgilbert01/convivio/tree/master/packages/connectors)
* [Deploy](https://github.com/jgilbert01/convivio/tree/master/packages/deploy)
* [Generate](https://github.com/jgilbert01/convivio/tree/master/packages/gen)
* [Testing](https://github.com/jgilbert01/convivio/tree/master/packages/webpack) 
* [Webpack](https://github.com/jgilbert01/convivio/tree/master/packages/testing)
* [Templates](https://github.com/jgilbert01/convivio/tree/master/templates)

* [Issues](https://github.com/jgilbert01/convivio/issues)
* [Pull Requests](https://github.com/jgilbert01/convivio/pulls)

* [Books](https://www.amazon.com/stores/John-Gilbert/author/B07BDR3P6P)
* [Blog](https://medium.com/@jgilbert001)

