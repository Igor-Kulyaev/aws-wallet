import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import {useEffect, useState} from "react";

const rows = [
  {name: 'Shop', date: '01.01.2023', amount: 30},
  {name: 'Shop', date: '02.01.2023', amount: 50},
  {name: 'Shop', date: '03.01.2023', amount: 100},
];

const ExpensesList = () => {
  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const openModal = () => {
    console.log('add new expense');
    setAddExpenseModal(true);
  };

  const closeModal = () => {
    console.log('close modal');
    setAddExpenseModal(false);
  };

  useEffect(() => {
    // add getting expenses list
  }, []);

  return (
    <div style={{display: "flex", justifyContent: "center"}}>
      <div style={{width: "750px"}}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Date</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.date}</TableCell>
                  <TableCell align="right">{row.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" onClick={openModal}>Add</Button>
      </div>
      <Dialog
        open={addExpenseModal}
        onClose={closeModal}
      >
        <DialogTitle id="alert-dialog-title">
          Do you want to add new expense?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Enter all the fields.
          </DialogContentText>
          <Stack spacing={2}>
            <TextField id="outlined-basic" label="Name" variant="outlined" />
            <TextField id="outlined-basic" label="Type of income" variant="outlined" />
            <TextField id="outlined-basic" label="Date" variant="outlined" />
            <TextField id="outlined-basic" label="Amount" variant="outlined" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Disagree</Button>
          <Button onClick={closeModal} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ExpensesList;