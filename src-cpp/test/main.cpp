#include <stdio.h>
#include <stdlib.h>

int fib(int n)
{
    int f1 = 0;
    int f2 = 1;
    if (n <= 2)
    {
        if (n == 1)
            return f1;
        else
            return f2;
    }
    else
        for (int i = 2; i < n; i++)
        {
            int temp = f2;
            f2 = f1 + f2;
            f1 = temp;
        }
    return f2;
}

int main(int argc, char **argv)
{
    if (argc < 2)
    {
        return 0;
    }
    int n = atoi(argv[1]);
    printf("%d\n", fib(n));
    return 0;
}