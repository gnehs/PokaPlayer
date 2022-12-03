db.createUser(
    {
        user: "<user for database which shall be created>",
        pwd: "<password of user>",
        roles: [
            {
                role: "readWrite",
                db: "<database to create>"
            }
        ]
    }
);