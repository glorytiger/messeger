# Messeger

Messeger is a headless Node application that lets you log in, read and send messages using the Facebook Messenger API.

## Output example - Login flow

![login-flow.png](/docs/login-flow.png)<br>
*Output shows the steps involved for logging in and getting a user's conversations*

## Installation

Using npm:
```
npm i
```

## Usage

```Node app.js -u <username> -p <password> -m <message> -r <reciptientId>```<br>
Reciptient id is a 64-bit integer value that can be aquired by logging in to an Messenger account in a browser and check the URL.

**Note** - Any account used with this application risks getting suspended or banned by Facebook.

## Credits

This project is inspired by and based on the work done in this blog:
https://intuitiveexplanations.com/tech/messenger

