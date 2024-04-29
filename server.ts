import express, { Request, Response } from 'express';
import mcloud from './api/mcloud';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.post('/', (req: Request, res: Response) => {
    mcloud(req, res);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
