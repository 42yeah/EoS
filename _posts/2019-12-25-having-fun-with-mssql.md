---
layout: post
title: What Is SQL Auditing?
featured: /assets/bodie-pyndus-JXqMjodZ0uM-unsplash.jpg
---

Well, the end of the semester is drawing near, and I've got MS SQL homework to do. So let's turn this post into a... ~~Homework?~~ Note! Sorry but this post will __not__ contain any code.

First, let's take a look at the definition of auditing from [docs.microsoft.com](https://docs.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine) (that is, like, so official!):

> Auditing an instance of the SQL Server Database Engine or an individual database involves tracking and logging events that occur on the Database Engine. SQL Server audit lets you create server audits, which can contain server audit specifications for server level events, and database audit specifications for database level events. Audited events can be written to the event logs or to audit files.

## Why will I need auditing?

Well, you might not be needing any, however government or company do. They dont want to become angry bumblebees when their databases were messed up and had no one to blame to. That was really bad. And thus, our endeared friend, MS SQL Server, __does__ come with several levels of auditing, ranging from really loose to gov/military level. Auditing wasn't supported in Standard Version of SQL Server 2016 (13.x) SP1.

## What needs to be audited?

Dangerous operations, of course! or more precisely:

- Operation types (such as UPDATE, SELECT, or DELETE)
- Subject & Object's clearance
- Operation date & time
- Affected data (by the operation), such as table, view, record, property, etc.
- Temporal tables - which means the temporal change of the table.

In these ways, we can easily track down who has been modifying the database illegally (and arrest him).

## What if I don't want this auditing thing?

Nah, this is not a mandatory feature. You can enable and disable it by pleasure. In fact, by default it is not enabled. Also this feature is quite costly: writing down all logs will take a lot of spaces, so make sure you could archive data periodically.

There are other ways you could cut down the expenses:

- Track only one user.
- Limit the maximum tracking events. (Trimming the foremost logs when the number of logs exceeds certain number)
- Archive the logging periodically

Also, you need to make __absolutely sure__ that no one except the DBA could delete the auditing log. Otherwise, what's the point of the auditing if it couldn't even audit itself? Except the DBA, other users should have __no__ permission over the audit log. Not even `SELECT`.

## More imformations

You can check out [The SQL Server Audit page of microsoft](https://docs.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine?view=sql-server-ver15). It's pretty nice, teaching you how to enable it and all.