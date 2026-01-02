"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Zod schemas for each transaction type
const purchaseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.date(),
  memo: z.string().optional(),
})

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
})

const incomeSchema = z.object({
  category: z.string().min(1, "Category is required"),
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
})

type PurchaseFormValues = z.infer<typeof purchaseSchema>
type ExpenseFormValues = z.infer<typeof expenseSchema>
type IncomeFormValues = z.infer<typeof incomeSchema>

export function AddTransactionDialog() {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("purchase")

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset all forms when dialog closes
      purchaseForm.reset()
      expenseForm.reset()
      incomeForm.reset()
      setActiveTab("purchase")
    }
  }

  // Purchase form
  const purchaseForm = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues: {
      category: "",
      amount: 0,
      date: new Date(),
      memo: "",
    },
  })

  // Expense form
  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      label: "",
      amount: 0,
    },
  })

  // Income form
  const incomeForm = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      category: "",
      label: "",
      amount: 0,
    },
  })

  const onPurchaseSubmit = async (data: PurchaseFormValues) => {
    console.log("Purchase data:", data)
    handleOpenChange(false)
  }

  const onExpenseSubmit = async (data: ExpenseFormValues) => {
    console.log("Expense data:", data)
    handleOpenChange(false)
  }

  const onIncomeSubmit = async (data: IncomeFormValues) => {
    console.log("Income data:", data)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction to track your finances.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          {/* Purchase Tab */}
          <TabsContent value="purchase">
            <Form {...purchaseForm}>
              <form
                onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={purchaseForm.control as any}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control as any}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control as any}
                  name="memo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memo</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional memo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={purchaseForm.formState.isSubmitting}
                  >
                    {purchaseForm.formState.isSubmitting
                      ? "Submitting..."
                      : "Add Purchase"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Expense Tab */}
          <TabsContent value="expense">
            <Form {...expenseForm}>
              <form
                onSubmit={expenseForm.handleSubmit(onExpenseSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={expenseForm.control as any}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={expenseForm.control as any}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter label" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={expenseForm.control as any}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={expenseForm.formState.isSubmitting}
                  >
                    {expenseForm.formState.isSubmitting
                      ? "Submitting..."
                      : "Add Expense"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income">
            <Form {...incomeForm}>
              <form
                onSubmit={incomeForm.handleSubmit(onIncomeSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={incomeForm.control as any}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={incomeForm.control as any}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter label" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={incomeForm.control as any}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={incomeForm.formState.isSubmitting}
                  >
                    {incomeForm.formState.isSubmitting
                      ? "Submitting..."
                      : "Add Income"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

