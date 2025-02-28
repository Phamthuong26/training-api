const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const User = require('../models/User');
const auth = require('../middleware/auth')

router.use(auth);

// create todo
// http://localhost:3000/api/todos/
router.post('/', async (req, res) => {
    try {
        const { title, description, status, dueDate, createdBy } = req.body;
        const userExists = await User.findById(createdBy);
        // Kiểm tra độ dài title và description
        if (!title || title.trim().length < 3) {
            return res.status(400).json({ message: 'Title phải có ít nhất 3 ký tự' });
        }
        if (!description || description.trim().length < 3) {
            return res.status(400).json({ message: 'Description phải có ít nhất 3 ký tự' });
        }
        // Kiểm tra user có tồn tại không
        if (!userExists) {
            return res.status(400).json({ message: 'User không tồn tại' });
        }
        // Kiểm tra dueDate có hợp lệ không (nếu có)
        if (dueDate && isNaN(Date.parse(dueDate))) {
            return res.status(400).json({ message: 'Ngày dueDate không hợp lệ' });
        }
        const newTodo = new Todo({ title, description, status, dueDate, createdBy });
        await newTodo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// get list
// http://localhost:3000/api/todos/
router.get('/', async (req, res) => {
    try {
        const { search, status, createdBy } = req.query;
        let query = {};
        // search by title, date
        // http://localhost:3000/api/todos?search=Mới
        // http://localhost:3000/api/todos?search=2025-02-20
        if (search && search.trim() !== '') {
            const title = search.trim();
            const date = new Date(title);

            // Kiểm tra YYY-MM-DD
            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(title) && !isNaN(date.getTime());
            if (title.includes('-') && !isValidDate) {
                return res.status(400).json({ message: 'Dịnh dạng đúng: YYYY-MM-DD' });
            }

            if (!isValidDate) {
                query.title = { $regex: title, $options: 'i' };
            }
            else {
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                query.dueDate = { $gte: date, $lte: endOfDay };
            }
        }
        // filter by status
        if (status) {
            query.status = status;
        }
        // filter by createBy
        if (createdBy) {
            query.createdBy = createdBy;
        }

        const todos = await Todo.find(query);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// update todo 
// http://localhost:3000/api/todos/:id
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status, dueDate } = req.body;
        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id,
            { title, description, status, dueDate },
            { new: true }
        );
        if (!updatedTodo) return res.status(404).json({ message: 'Todo not found' });
        res.json(updatedTodo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// delete to do 
// http://localhost:3000/api/todos/:id
router.delete('/:id', async (req, res) => {
    try {
        const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
        if (!deletedTodo) return res.status(404).json({ message: 'Todo not found' });
        res.json({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
