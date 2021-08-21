+++
title = "Running a Hugo Server on Local and Public Networks"
date = 2021-08-21T10:47:25-06:00
draft = false
tags = ["web", "hugo", "cloudflared", "fish"]
+++

When writing posts or updating the layout of this website, I run
[Hugo's](https://gohugo.io/) local server to view my changes live. Sometimes I
want to view my website from a different device on my network to check how it
renders the page. Thankfully, Hugo's server has some builtin flags to bind the
server to my machine's IP address to allow viewing from any machine on the
network.

## Run the Hugo server on a local network

By default `hugo server` will create a server running on localhost port
1313. If your IP address is `192.168.1.20`, providing the following flags to
Hugo will will bind the server to your device's IP address on your local
network instead of localhost. Substitute your own IP address in place of my
example address.

```shell
$ hugo server --bind 192.168.1.20 --baseURL http://192.168.1.20/
```

That's all it takes! After doing this, any device on your local network can
access the Hugo development server by visiting `http://192.168.1.20:1313`.

The `--bind` flag binds the server to the given IP address rather than
localhost. The other important flag is `--baseURL` which Hugo uses for prefixing
internal links on the webpage. If you don't supply a base URL, any links that
Hugo creates will be prefixed with `http://localhost:1313` which will not work
for devices other than the one running the server.

This covers most of my needs when I want to view my Hugo website on a different
device, but I occasionally need to share access to my development server with
someone outside my network.

## Access the development server from a public URL

There are some tools that can create a temporary public URL that connects
directly to a server running on your machine. Two services that I am aware of are
[ngrok](https://ngrok.com/) and [Cloudflare
Tunnel](https://www.cloudflare.com/products/tunnel/). I use Cloudflare Tunnel,
but both can be used to accomplish the same task.

Cloudflare Tunnel creates an encrypted tunnel between your server and
Cloudflare's nearest data center without requiring you to open public ports on
your network. The program is called cloudflared and is easy to install and use.
[Here are the
docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup)
for installing cloudflared for Linux, MacOS, or Windows.

{{< aside >}}
The Cloudflare docs are focused on creating persistent tunnels registered on
your own domain, and only briefly cover the TryCloudflare service. There is no
need to authenticate cloudflared or create config files to use the subdomains of
`trycloudflare.com`. You don't even need a Cloudflare account! Here is [more
documentation on TryCloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/trycloudflare).
{{</ aside >}}

Once installed the following command will create a temporary tunnel. The `--url`
flag specifies which local server to connect the tunnel to.

```shell
$ cloudflared tunnel --url http://localhost:1313
...
2021-08-21T01:30:49Z INF +------------------------------------------------------------+
2021-08-21T01:30:49Z INF |  Your free tunnel has started! Visit it:                   |
2021-08-21T01:30:49Z INF |    https://cloudflare-example-subdomain.trycloudflare.com  |
2021-08-21T01:30:49Z INF +------------------------------------------------------------+
...
```

On the Hugo side It is important to set the base URL to the Cloudflare tunnel
domain. The `--appendPort=false` flag prevents Hugo from appending the port to
the links. Without this flag, Hugo will create links like
`https://cloudflare-example-subdomain.trycloudflare.com:1313/example-path`,
which will not load properly because Cloudflare is not serving the tunnel over
port 1313.

```shell
$ hugo server --appendPort=false --baseURL https://cloudflare-example-subdomain.trycloudflare.com
```

No matter how many times I start a tunnel, the simplicity of cloudflared always
impresses me. While slightly more involved than running a Hugo server on a local
network, cloudflared makes it trivial to create a temporary public link to your
development server. The link will no longer work once you close the Cloudflare
tunnel.

## A fish function to automate local and public servers

I find myself needing local and public access to my Hugo servers on a regular
basis. To automate this process somewhat, I created a fish function to wrap
`hugo`. Feel free to use this function directly, or as inspiration for your own
fish or bash scripts. It isn't very robust, but it works well enough for me.

```fish
function hugo -a command
    switch $command
        # run on the local network
        case l local
            # to trim off "l" or "local" from the other args
            set argv $argv[2..]
            set ip_addr (hostname -i)
            command hugo server --bind $ip_addr --baseURL "http://$ip_addr" $argv

        # run on a public network with cloudflared
        case p public
            # to trim off "p" or "public" from the other args
            set argv $argv[2..]

            # create a temporary file
            set tmpfile (mktemp)
            cloudflared tunnel --url http://localhost:1313 2> $tmpfile &

            # wait for the server to start
            echo -n Waiting for cloudflare tunnel to start
            set cloudflare_url
            while test -z $cloudflare_url;
                echo -n .
                set cloudflare_url (grep --color=never -o -m1 "http.*trycloudflare.com" $tmpfile)
                sleep 1
            end
            echo -e " started\n"

            # run hugo through the tunnel
            command hugo server --appendPort=false --baseURL $cloudflare_url $argv
            echo -e "\nShutting down tunnel"
            kill $last_pid
            sleep 1

        # fall through to all other uses of hugo
        case "*"
            command hugo $argv
    end
end
```

With this function I can run `hugo local` to run a server on my local network,
or `hugo public` to run a server accessible through a Cloudflare Tunnel.
Additional arguments like `-D` can still be passed to enable draft post
visibility.
