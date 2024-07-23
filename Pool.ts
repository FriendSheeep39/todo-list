import mariadb from 'mariadb';

export class Pool {
    private readonly _pool: mariadb.Pool = mariadb.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        connectionLimit: 10,
        database: process.env.DB_NAME,
        leakDetectionTimeout: 5000,
        trace: true
    });

    public async init() {
        try {
            await this._pool.getConnection().then(conn => {
                conn.beginTransaction().then(() => {
                    conn.query('CREATE TABLE IF NOT EXISTS todos (task VARCHAR(255) PRIMARY KEY, finished BOOLEAN)')
                        .then(() => conn.commit())
                        .catch(err => {
                            conn.rollback().then(() => {
                                console.error("Error: " + err);
                                throw err;
                            });
                        }).finally(() => conn ? conn.release() : () => {});
                })
            });
        } catch (err) {
            console.error("Error: " + err);
            throw err;
        }
    }

    public async getTodos(): Promise<Todo[]> {
        const todos: Todo[] = [];
        await this._pool.getConnection().then(async conn => {
            await conn.query('SELECT * FROM todos')
                .then(res => {
                    res.forEach((row: Todo) => {
                        todos.push({task: row.task, finished: row.finished});
                    });
                })
                .catch(async err => {
                    console.error("Error: " + err);
                    throw err;
                })
                .finally(async () => conn ? await conn.release() : () => {});
        });

        return todos;
    }

    public async addTodo(todo: Todo): Promise<void> {
        await this._pool.getConnection().then(async conn => {
            await conn.beginTransaction();
            await conn.prepare('INSERT INTO todos (task, finished) VALUES (?, ?)')
                .then(async stmt => {
                    await stmt.execute([todo.task, todo.finished])
                    await conn.commit();
                    stmt.close();
                })
                .catch(async err => {
                    await conn.rollback();
                    console.error("Error: " + err);
                    throw err;
                })
                .finally(async () => conn ? await conn.release() : () => {});
        });
    }

    public async updateTodo(todo: Todo): Promise<void> {
        await this._pool.getConnection().then(async conn => {
            await conn.beginTransaction();
            await conn.prepare('UPDATE todos SET finished = ? WHERE task = ?')
                .then(async stmt => {
                    await stmt.execute([todo.finished, todo.task])
                    await conn.commit();
                    stmt.close();
                })
                .catch(async err => {
                    await conn.rollback();
                    console.error("Error: " + err);
                    throw err;
                })
                .finally(async () => conn ? await conn.release() : () => {});
        });
    }

    public async deleteTodo(todo: Todo): Promise<void> {
        await this._pool.getConnection().then(async conn => {
            await conn.beginTransaction();
            await conn.prepare('DELETE FROM todos WHERE task = ?')
                .then(async stmt => {
                    await stmt.execute([todo.task])
                    await conn.commit();
                    stmt.close();
                })
                .catch(async err => {
                    await conn.rollback();
                    console.error("Error: " + err);
                    throw err;
                })
                .finally(async () => conn ? await conn.release() : () => {});
        });
    }
}

export interface Todo {
    task: string,
    finished: boolean
}