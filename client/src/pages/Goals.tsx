import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const goalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required"),
  description: z.string().optional(),
  targetAmount: z.string().min(1, "Target amount is required"),
  targetDate: z.string().optional(),
});

export default function Goals() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    goalName: "",
    description: "",
    targetAmount: "",
    targetDate: "",
  });

  const goalsQuery = trpc.goals.list.useQuery();
  const createMutation = trpc.goals.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = goalSchema.parse(formData);
      await createMutation.mutateAsync({
        ...validated,
        targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
      });
      toast.success("Goal created successfully!");
      setFormData({ goalName: "", description: "", targetAmount: "", targetDate: "" });
      setOpen(false);
      await goalsQuery.refetch();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Validation failed");
      } else {
        toast.error("Failed to create goal");
      }
    }
  };

  const goals = goalsQuery.data || [];
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const totalTargeted = activeGoals.reduce(
    (sum, g) => sum + parseFloat(String(g.targetAmount || 0)),
    0
  );
  const totalSaved = activeGoals.reduce(
    (sum, g) => sum + parseFloat(String(g.currentAmount || 0)),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress towards financial targets
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>
                Set a financial target and track your progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  placeholder="e.g., New Laptop"
                  value={formData.goalName}
                  onChange={(e) =>
                    setFormData({ ...formData, goalName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Why is this goal important?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount ($)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="1000"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date (optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDate: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Goal"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      {activeGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeGoals.length}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalTargeted.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${totalSaved.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No active goals yet</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Create Your First Goal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Savings Goal</DialogTitle>
                  <DialogDescription>
                    Set a financial target and track your progress
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="goalName">Goal Name</Label>
                    <Input
                      id="goalName"
                      placeholder="e.g., New Laptop"
                      value={formData.goalName}
                      onChange={(e) =>
                        setFormData({ ...formData, goalName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Why is this goal important?"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAmount">Target Amount ($)</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      value={formData.targetAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, targetAmount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetDate">Target Date (optional)</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) =>
                        setFormData({ ...formData, targetDate: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Goal"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeGoals.map((goal) => {
            const progress =
              (parseFloat(String(goal.currentAmount || 0)) /
                parseFloat(String(goal.targetAmount))) *
              100;
            const daysLeft = goal.targetDate
              ? Math.ceil(
                  (new Date(goal.targetDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <Card key={goal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{goal.goalName}</CardTitle>
                      {goal.description && (
                        <CardDescription>{goal.description}</CardDescription>
                      )}
                    </div>
                    {daysLeft !== null && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-semibold">
                        ${parseFloat(String(goal.currentAmount || 0)).toFixed(2)} /{" "}
                        ${parseFloat(String(goal.targetAmount)).toFixed(2)}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round(progress)}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Completed Goals</h2>
          <div className="space-y-4">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="border-0 shadow-sm opacity-75">
                <CardHeader>
                  <CardTitle className="line-through">
                    {goal.goalName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Completed on{" "}
                    {new Date(goal.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
