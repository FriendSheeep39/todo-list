import express from 'express';
import cors from "cors";
import {Pool, Todo} from './Pool';
import {StatusCodes} from "http-status-codes";

export const todosRouter = express.Router();
todosRouter.use(cors());
todosRouter.use(express.json());

const pool: Pool = new Pool();
init();

async function init(){
    await pool.init();
}

todosRouter.get('/', async (_, res) => {
    await pool.getTodos()
        .then(todos => {
            res.send(todos);
        })
        .catch(err => {
            console.log("Error: " + err);
            res.sendStatus(StatusCodes.NOT_FOUND);
        });
});

todosRouter.post('/', async (req, res) => {
    const todo: Todo = req.body;

    await pool.getTodos().then(todos => todos.forEach(t => {
        if (t.task === todo.task) {
            res.sendStatus(StatusCodes.BAD_REQUEST);
        }
    })).catch(err => {
        console.log("Error: " + err);
        res.sendStatus(StatusCodes.BAD_REQUEST);
    });

    await pool.addTodo(todo)
        .then(() => {
            res.sendStatus(StatusCodes.CREATED);
        })
        .catch(err => {
            console.log("Error: " + err);
            res.sendStatus(StatusCodes.BAD_REQUEST);
        });
});

todosRouter.put('/', async (req, res) => {
    const todo: Todo = req.body;

    await pool.updateTodo(todo)
        .then(() => {
                res.sendStatus(StatusCodes.OK);
        })
        .catch(err => {
            console.log("Error: " + err);
            res.sendStatus(StatusCodes.BAD_REQUEST);
        });
});

todosRouter.delete('/', async (req, res) => {
    const todo: Todo = req.body;

    await pool.deleteTodo(todo)
        .then(() => {
            res.sendStatus(StatusCodes.OK);
        })
        .catch(err => {
            console.log("Error: " + err);
            res.sendStatus(StatusCodes.BAD_REQUEST);
        });
});

todosRouter.delete('/all', async (_, res) => {
    await pool.getTodos().then(todos => todos.forEach(async todo => {
        await pool.deleteTodo({
            task: todo.task,
            finished: todo.finished
        })
        .catch(err => {
            console.log("Error: " + err);
            res.sendStatus(StatusCodes.NOT_FOUND);
        });
    }))
    .then(() => {
        res.sendStatus(StatusCodes.OK);
    })
    .catch(err => {
        console.log("Error: " + err);
        res.sendStatus(StatusCodes.BAD_REQUEST);
    });
});

todosRouter.delete('/finished', async (_, res) => {
    await pool.getTodos().then(todos => todos.forEach(async todo => {
        if (todo.finished) {
            await pool.deleteTodo(todo)
            .catch(err => {
                console.log("Error: " + err);
                res.sendStatus(StatusCodes.BAD_REQUEST);
            });
        }
    }))
    .then(() =>
        res.sendStatus(StatusCodes.OK)
    )
    .catch(err => {
        console.log("Error: " + err);
        res.sendStatus(StatusCodes.BAD_REQUEST);
    });
});