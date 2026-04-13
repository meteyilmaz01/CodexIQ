using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Domain.Enums
{
    public enum EvaluationStatus
    {
        Pending = 0,
        Extracting = 1,
        Evaluating = 2,
        Completed = 3,
        Failed = 4
    }
}
