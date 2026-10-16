const Todo = require('../models/Todo');

// GET /api/todos
const getTodos = async (req, res) => {
  try {
    const { filter } = req.query;
    const query = { userId: req.user._id };
    if (filter === 'Pending') query.done = false;
    if (filter === 'Done') query.done = true;

    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/todos
const createTodo = async (req, res) => {
  try {
    const { text, dueDate, priority } = req.body;
    if (!text) return res.status(400).json({ message: 'Todo text is required' });

    const todo = await Todo.create({
      userId: req.user._id,
      text,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'Medium',
    });
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    const { text, done, dueDate, priority } = req.body;
    if (text !== undefined) todo.text = text;
    if (done !== undefined) todo.done = done;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) todo.priority = priority;

    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
