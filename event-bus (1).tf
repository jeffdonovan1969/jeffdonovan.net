locals {
  default_tags = {
    ManagedBy       = "Terraform"
    BusinessAppName = var.business_app_name
    Environment     = var.environment_tag
  }
}

resource "aws_sqs_queue" "lambda_dlq" {
  name = "${var.service_name}-failed-events-dlq"

  tags = merge(local.default_tags, {
    Name = "${var.service_name}-dlq"
  })
}

# ---------------------------------------------------------------------------
# IAM role for EventBridge Scheduler to invoke Lambda
# ---------------------------------------------------------------------------

resource "aws_iam_role" "scheduler_invoke_role" {
  name = "${var.service_name}-scheduler-invoke-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = merge(local.default_tags, {
    Name = "${var.service_name}-scheduler-invoke-role"
  })
}

resource "aws_iam_role_policy" "scheduler_invoke_policy" {
  name = "${var.service_name}-scheduler-invoke-policy"
  role = aws_iam_role.scheduler_invoke_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = module.sftp_pull_cenlar_lambda.lambda_function_arn
    }]
  })
}

# ---------------------------------------------------------------------------
# Main file processing — runs at 3 PM, 4 PM, 5 PM, 6 PM, 7 PM ET daily
# ---------------------------------------------------------------------------

resource "aws_scheduler_schedule" "daily_main_trigger" {
  name        = "${var.service_name}-daily-main-trigger"
  description = "Trigger ${var.service_name} main file processing daily at 3:00 PM–7:00 PM ET (5 times)"
  state       = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 15,16,17,18,19 * * ? *)"
  schedule_expression_timezone = "America/New_York"

  target {
    arn      = module.sftp_pull_cenlar_lambda.lambda_function_arn
    role_arn = aws_iam_role.scheduler_invoke_role.arn

    input = jsonencode({
      source      = "eventbridge.scheduler"
      detail-type = "Daily Scheduled Task"
      detail = {
        task_type   = "daily_main"
        environment = var.environment_tag
      }
    })

    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 3
    }

    dead_letter_config {
      arn = aws_sqs_queue.lambda_dlq.arn
    }
  }

}

resource "aws_cloudwatch_log_group" "daily_main_eventbridge_logs" {
  name              = "/aws/scheduler/${aws_scheduler_schedule.daily_main_trigger.name}"
  retention_in_days = 7

  tags = merge(local.default_tags, {
    Name = "${var.service_name}-daily-main-event-monitoring"
  })
}

# ---------------------------------------------------------------------------
# Missing docs processing — runs at 3:00 PM ET daily
# ---------------------------------------------------------------------------

resource "aws_scheduler_schedule" "missing_docs_trigger" {
  name        = "${var.service_name}-missing-docs-trigger"
  description = "Trigger ${var.service_name} missing docs processing daily at 3:00 PM ET"
  state       = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 15 * * ? *)"
  schedule_expression_timezone = "America/New_York"

  target {
    arn      = module.sftp_pull_cenlar_lambda.lambda_function_arn
    role_arn = aws_iam_role.scheduler_invoke_role.arn

    input = jsonencode({
      source      = "eventbridge.scheduler"
      detail-type = "Daily Scheduled Task"
      detail = {
        task_type   = "missing_docs"
        environment = var.environment_tag
      }
    })

    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 3
    }

    dead_letter_config {
      arn = aws_sqs_queue.lambda_dlq.arn
    }
  }
}

resource "aws_cloudwatch_log_group" "missing_docs_eventbridge_logs" {
  name              = "/aws/scheduler/${aws_scheduler_schedule.missing_docs_trigger.name}"
  retention_in_days = 7

  tags = merge(local.default_tags, {
    Name = "${var.service_name}-missing-docs-event-monitoring"
  })
}
