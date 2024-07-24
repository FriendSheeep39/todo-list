document.addEventListener("DOMContentLoaded", async () => {
    await init();
});
const url = `http://localhost:3000`; // Backend's IP address with port
let todosList = [];
let filtered = false;
async function init() {
    await fetch(url + "/api/todos", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(todos => {
        todos.forEach((t) => {
            const newTodo = { task: t.task, finished: t.finished };
            todosList.push(newTodo);
        });
    })
        .catch(err => {
        console.error("Error: " + err);
    });
    await loadTodos();
    document.getElementById("delete-all-btn").addEventListener("click", async () => {
        if (todosList.length === 0) {
            return alert("No todos to delete!");
        }
        if (confirm("Do you really want to delete all todos?")) {
            await fetch(url + "/api/todos/all", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(async () => {
                todosList.splice(0, todosList.length);
                await loadTodos();
            }).catch(err => {
                console.error("Error: " + err);
            });
        }
    });
    document.getElementById("delete-finished-btn").addEventListener("click", async () => {
        if (todosList.length === 0 || todosList.filter(todo => todo.finished).length === 0) {
            return alert("No todos to delete!");
        }
        if (confirm("Do you really want to delete the finished todos?")) {
            await fetch(url + "/api/todos/finished", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(async () => {
                todosList = todosList.filter(todo => !todo.finished);
            }).catch(err => {
                console.error("Error: " + err);
            });
            await loadTodos();
        }
    });
    document.getElementById("filter-btn").addEventListener("click", async () => {
        filtered = !filtered;
        document.getElementById("search-todo").click();
    });
    document.getElementById("add-btn").addEventListener("click", async () => {
        await addTodo();
    });
    document.getElementById("todo").addEventListener("keypress", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("add-btn").click();
        }
    });
    document.getElementById("search-todo").addEventListener("input", event => {
        document.getElementById("search-todo").click();
    });
    document.getElementById("search-todo").addEventListener("click", event => {
        const searchTerm = event.target.value.toLowerCase();
        document.getElementById("table").innerHTML = "";
        const filteredTodos = filtered ? todosList.filter(todo => !todo.finished).filter(todo => todo.task.toLowerCase().includes(searchTerm)) : todosList.filter(todo => todo.task.toLowerCase().includes(searchTerm));
        filteredTodos.forEach(async (todo) => await renderTodo(todo));
        if (filtered) {
            document.getElementById("filter-btn").textContent = "Show All";
        }
        else {
            document.getElementById("filter-btn").textContent = "Show Ongoing";
        }
    });
}
async function loadTodos() {
    document.getElementById("table").innerHTML = "";
    if (filtered) {
        document.getElementById("filter-btn").textContent = "Show All";
    }
    else {
        document.getElementById("filter-btn").textContent = "Show Ongoing";
    }
    for (const todo of todosList) {
        await renderTodo(todo);
    }
    document.getElementById("total-todos").textContent = `Total Todos: ${todosList.length}`;
    updateOngoingTodos();
    updateProgress();
    todosList.sort((a, b) => a.finished ? 1 : -1);
}
async function addTodo() {
    const input = document.getElementById("todo").value;
    if (todosList.find(todo => todo.task === input)) {
        return alert("Todo already exists");
    }
    if (input === "") {
        return alert("Please enter a todo");
    }
    const newTodo = { task: input, finished: false };
    todosList.push(newTodo);
    await fetch(url + "/api/todos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newTodo)
    }).catch(err => {
        console.error("Error: " + err);
    });
    await loadTodos();
    document.getElementById("todo").value = "";
}
async function renderTodo(todo) {
    if (filtered && todo.finished) {
        return;
    }
    const tr = document.createElement("tr");
    const newTodo = document.createElement("td");
    newTodo.innerHTML = todo.finished ? '<strike>' + todo.task + '</strike>' : todo.task;
    newTodo.addEventListener("click", async () => {
        const idx = todosList.findIndex(t => t.task === newTodo.innerText);
        todosList[idx].finished = !todosList[idx].finished;
        newTodo.innerHTML = newTodo.innerHTML === newTodo.innerText ?
            '<strike>' + newTodo.innerText + '</strike>' :
            newTodo.innerText;
        updateOngoingTodos();
        updateProgress();
        await fetch(url + "/api/todos", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(todosList[idx])
        }).catch(err => {
            console.error("Error: " + err);
        });
    });
    const button = document.createElement("button");
    button.innerHTML = "&#10006;";
    button.classList.add("remove-btn");
    button.addEventListener("click", async () => {
        if (confirm("Do you want to delete this todo?")) {
            const todo = { task: newTodo.innerText, finished: newTodo.innerHTML !== newTodo.innerText };
            await fetch(url + "/api/todos", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(todo)
            }).catch(err => {
                console.error("Error: " + err);
            });
            const idx = todosList.findIndex(t => t.task === todo.task);
            if (idx !== -1) {
                todosList.splice(idx, 1);
            }
            await loadTodos();
        }
    });
    document.getElementById("table").appendChild(tr);
    tr.appendChild(newTodo);
    tr.appendChild(button);
}
function updateProgress() {
    const totalTodos = todosList.length;
    const completedTodos = todosList.filter(todo => todo.finished).length;
    const progressPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const progressBar = document.getElementById('relative-completion');
    if (progressBar) {
        progressBar.value = progressPercentage;
    }
}
function updateOngoingTodos() {
    const count = todosList.filter(t => !t.finished).length;
    document.getElementById("ongoing-todos").textContent = `Ongoing Todos: ` + (count > 0 ? count : `None!!!`);
}
