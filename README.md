# Ubs Sample Backend

## Synopsis

The simple backend template for MONA platform applications. This project contains an endpoint that requires    

## Requirements for begin

- Nodejs and npm (of course)
- Docker (and docker-compose) for running Ubs users, kafka and MongoDB
- Desire to live

## Start the application

- Run the docker-compose.yml file in the infrastructure directory
    ```bash
    cd infrastructure
    docker compose up -d
    ```
- Rename the `sample.env` file as `.env`
- Run `npx nx serve ubs-sample-backend-mona` to start the development server. 
- To test the environment. Firstly login in ubs-users and then, send the simple request that header includes the token
```bash
curl --location 'http://localhost:3000/api/auth' \
--header 'Content-Type: application/json' \
--data '{
  "login": "admin",
  "password": "admin"
}'

# Response:
# {
#    "token": "<THE TOKEN FROM THE USERS SERVICE>",
 #   "success": true,
 #   "message": "User login is success"
#}

curl --location 'http://localhost:3169/api' \
--header 'Authorization: Bearer <THE TOKEN FROM THE USERS SERVICE>'

# response:
# {
#     "message": "Hello API"
# }

```
- Mongoose and etc. is preinstalled. to do something with mongodb, please refer [the official documentation from nestjs](https://docs.nestjs.com/techniques/mongodb)

Happy coding!



## Build for production

Run `npx nx build ubs-sample-backend-mona` to build the application. The build artifacts are stored in the output directory (e.g. `dist/` or `build/`), ready to be deployed.

## Running tasks

To execute tasks with Nx use the following syntax:

```
npx nx <target> <project> <...options>
```

You can also run multiple targets:

```
npx nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
npx nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

Targets can be defined in the `package.json` or `projects.json`. Learn more [in the docs](https://nx.dev/features/run-tasks).
