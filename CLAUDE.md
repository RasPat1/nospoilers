## Testing
After every change make sure all tests are passing.
If you've added a new feature add tests for that feature.

If the project has a UI, approach it with a mobile first development.


## User Flows
Keep a set of use cases and user flows in a set of files that are always referenced when making changes. A change request to a user flow or feature shoudl be marked in these files and updated in tests.
Do user centric development. The most important part of the project is keeping the amin user flows working. Any changes that break them should be fixed.
Any user interactable element like a button or text box or link or playable video should be noted and then tested with a stress test.

## Diagramming
Keep a set of diagrams describing the user flow and how the pages and modules connect together that I can see at any time. Make these diagrams and relationships machine readable for you as well. Be aware of these relationships and try and understand how a change in one place will affect other elements of the app.

## Modularity
You shoudl try to build small reusables modules.

## Propmpting
Recomend refatctoring if the diagramming, UI, tests, or user flows don't seem to make sense to you. Check this in any downtime you have or when requested. We'll call this a consistency check. Or ConCheck. When I ask for a ConCheck ensure that all test pass, all diagrams are updated, all features are docuemnted, all user flows are recorded, and any rules about business logic are recorded explicitly

## Business Logic
When making products I want to specify user flows and business logic. Business logic may include ways of breaking ties, Invariants (things that shoudl always be true), purposes of certain features, and relative importance of certain features. Keep a list of all business logic rules in one place that is machine readable and that I can see as well.

## Correctness
A user should never get a 500 error.
Check the console prompt when doing automation and correct errors you encounter.
Add any errors to your todo list to be addressed with later if they are not part of the main task you are focusing on.
There should be no dead links.
There are zero-states for all situations.
When buildlign features don't break existing functionality.


## Best Practices
Be sure to typecheck when you're done making a series of code changes
Prefer running single tests, and not the whole test suite, for performance
Createa. bug log that lists bugs and their details and resolutions and reference that when making changes to avoid repeating mistakes

## Development
The app should work and be developable offline.
Prefer atomic commits. Smaller commits addressing one specific aspect at a time rather than larger commits with many changes.
When you find a bug add a test for it.
Use a variety of robust data for testing.
Keep all adhoc scripts in one folder
Keep all documentation in one folder
Keep very few files in teh root of the directory




